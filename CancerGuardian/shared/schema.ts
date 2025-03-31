import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Database tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  age: integer("age"),
  gender: text("gender"),
  email: text("email"),
  created_at: timestamp("created_at").defaultNow()
});

export const test_results = pgTable("test_results", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  test_type: text("test_type").notNull(),
  cancer_type: text("cancer_type").notNull(),
  result: text("result").notNull(),
  risk_level: text("risk_level").notNull(),
  confidence: integer("confidence"),
  recommendations: text("recommendations"),
  questionnaire: json("questionnaire"),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow()
});

export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  specialties: text("specialties").array(),
  rating: integer("rating"),
  review_count: integer("review_count"),
  phone: text("phone"),
  website: text("website")
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  hospital_id: integer("hospital_id").notNull().references(() => hospitals.id),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("pending"),
  reason: text("reason"),
  doctor: text("doctor"),
  specialty: text("specialty"),
  created_at: timestamp("created_at").defaultNow()
});

export const recovery_plans = pgTable("recovery_plans", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  test_result_id: integer("test_result_id").references(() => test_results.id),
  title: text("title").notNull(),
  description: text("description"),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  created_at: timestamp("created_at").defaultNow()
});

export const recovery_activities = pgTable("recovery_activities", {
  id: serial("id").primaryKey(),
  recovery_plan_id: integer("recovery_plan_id").notNull().references(() => recovery_plans.id),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency"),
  duration: text("duration"),
  completed: boolean("completed").default(false),
  created_at: timestamp("created_at").defaultNow()
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const loginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6)
});

export const insertTestResultSchema = createInsertSchema(test_results);
export const insertHospitalSchema = createInsertSchema(hospitals);
export const insertAppointmentSchema = createInsertSchema(appointments);
export const insertRecoveryPlanSchema = createInsertSchema(recovery_plans);
export const insertRecoveryActivitySchema = createInsertSchema(recovery_activities);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

export type TestResult = typeof test_results.$inferSelect;
export type InsertTestResult = typeof test_results.$inferInsert;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = typeof hospitals.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

export type RecoveryPlan = typeof recovery_plans.$inferSelect;
export type InsertRecoveryPlan = typeof recovery_plans.$inferInsert;

export type RecoveryActivity = typeof recovery_activities.$inferSelect;
export type InsertRecoveryActivity = typeof recovery_activities.$inferInsert;
