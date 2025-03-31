import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { supabase } from "./supabase";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt (used for in-memory and direct database implementations)
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare a plaintext password with a hashed one (used for in-memory and direct database implementations)
 */
async function comparePasswords(supplied: string, stored: string) {
  // Skip comparison for Supabase (it uses bcrypt via database trigger)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    // In Supabase mode, the password comparison is done by the database directly
    // during the user retrieval step using PostgreSQL's auth functions
    return true;
  }
  
  // For non-Supabase implementations, use our own password comparison
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Special login function for Supabase authentication that uses the built-in auth functions
 */
async function supabaseLogin(username: string, password: string) {
  try {
    // Check authentication using Supabase's built-in SQL function
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username,
      p_password: password
    });
    
    if (error) {
      console.error("Supabase authentication error:", error);
      return null;
    }
    
    if (data) {
      return await storage.getUserByUsername(username);
    }
    
    return null;
  } catch (error) {
    console.error("Error in Supabase login:", error);
    return null;
  }
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "cancer-guardian-session-secret";

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Use Supabase authentication if available
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
          const user = await supabaseLogin(username, password);
          if (!user) {
            return done(null, false, { message: "Invalid username or password" });
          }
          return done(null, user);
        } 
        // Fallback to local authentication
        else {
          const user = await storage.getUserByUsername(username);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid username or password" });
          } else {
            return done(null, user);
          }
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input using the insertUserSchema
      const validatedData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // In Supabase mode, we pass the plain password as Supabase will handle hashing
      // via the database trigger we set up in database.sql
      const user = await storage.createUser({
        ...validatedData,
        // Only hash the password if not using Supabase
        password: process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY 
          ? validatedData.password 
          : await hashPassword(validatedData.password),
      });

      // Remove password from the response
      const sanitizedUser = { ...user, password: undefined };

      req.login(user, (err: any) => {
        if (err) return next(err);
        res.status(201).json(sanitizedUser);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });

      req.login(user, (err: any) => {
        if (err) return next(err);
        // Remove password from the response
        const sanitizedUser = { ...user, password: undefined };
        res.status(200).json(sanitizedUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove password from the response
    const sanitizedUser = { ...req.user, password: undefined };
    res.json(sanitizedUser);
  });
}
