import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  generateFollowUpQuestion, 
  generateRiskAssessment, 
  generateChatbotResponse 
} from "./api/gemini";
import { supabase } from "./supabase";
import { insertTestResultSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Get all test results for a user
  app.get("/api/test-results", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const results = await storage.getUserTestResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error retrieving test results:", error);
      res.status(500).json({ message: "Failed to retrieve test results" });
    }
  });

  // Create a new test result
  app.post("/api/test-results", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const testResultData = { ...req.body, userId };
      
      // Validate data
      const validatedData = insertTestResultSchema.parse(testResultData);
      
      const result = await storage.createTestResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating test result:", error);
      res.status(500).json({ message: "Failed to create test result" });
    }
  });

  // Get a specific test result
  app.get("/api/test-results/:id", isAuthenticated, async (req, res) => {
    try {
      const resultId = parseInt(req.params.id, 10);
      const result = await storage.getTestResultById(resultId);
      
      if (!result) {
        return res.status(404).json({ message: "Test result not found" });
      }
      
      // Check if this result belongs to the requesting user
      if (result.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to test result" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error retrieving test result:", error);
      res.status(500).json({ message: "Failed to retrieve test result" });
    }
  });

  // Get all hospitals
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await storage.getHospitals();
      res.json(hospitals);
    } catch (error) {
      console.error("Error retrieving hospitals:", error);
      res.status(500).json({ message: "Failed to retrieve hospitals" });
    }
  });

  // Get a specific hospital
  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id, 10);
      const hospital = await storage.getHospitalById(hospitalId);
      
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      
      res.json(hospital);
    } catch (error) {
      console.error("Error retrieving hospital:", error);
      res.status(500).json({ message: "Failed to retrieve hospital" });
    }
  });

  // Generate a follow-up question for the basic test
  app.post("/api/generate-question", isAuthenticated, async (req, res) => {
    try {
      const { bodyPart, previousQuestions, previousAnswers } = req.body;
      
      if (!bodyPart) {
        return res.status(400).json({ message: "Body part is required" });
      }
      
      const result = await generateFollowUpQuestion(
        bodyPart,
        previousQuestions || [],
        previousAnswers || []
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error generating question:", error);
      res.status(500).json({ message: "Failed to generate question" });
    }
  });

  // Generate a risk assessment
  app.post("/api/generate-assessment", isAuthenticated, async (req, res) => {
    try {
      const { bodyPart, questions, answers } = req.body;
      
      if (!bodyPart || !questions || !answers) {
        return res.status(400).json({ message: "Body part, questions, and answers are required" });
      }
      
      const result = await generateRiskAssessment(bodyPart, questions, answers);
      res.json(result);
    } catch (error) {
      console.error("Error generating assessment:", error);
      res.status(500).json({ message: "Failed to generate assessment" });
    }
  });

  // Generate a chatbot response
  app.post("/api/chatbot", isAuthenticated, async (req, res) => {
    try {
      const { query, history } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const response = await generateChatbotResponse(query, history || []);
      res.json({ response });
    } catch (error) {
      console.error("Error generating chatbot response:", error);
      res.status(500).json({ message: "Failed to generate chatbot response" });
    }
  });

  // API endpoint to check Gemini API status
  app.get("/api/gemini-status", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(200).json({ 
          available: false, 
          message: "Gemini API key is not configured. Using fallback mode." 
        });
      }
      
      // Test the API with a simple request
      const testPrompt = "What is cancer? Please provide a one-sentence response.";
      const response = await generateChatbotResponse(testPrompt, []);
      
      res.status(200).json({ 
        available: true, 
        message: "Gemini API is properly configured and working.",
        sample: response.substring(0, 100) // Just return the first 100 chars as a sample
      });
    } catch (error) {
      console.error("Error checking Gemini API status:", error);
      res.status(200).json({ 
        available: false, 
        message: `Gemini API error: ${error instanceof Error ? error.message : String(error)}`,
        error: true
      });
    }
  });
  
  // API endpoint to check Supabase connection status
  app.get("/api/supabase-status", async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ 
          available: false, 
          message: "Supabase is not configured. Using fallback storage." 
        });
      }
      
      // Test the connection with a simple query
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        throw new Error(error.message);
      }
      
      res.status(200).json({ 
        available: true, 
        message: "Supabase is properly configured and working."
      });
    } catch (error) {
      console.error("Error checking Supabase status:", error);
      res.status(200).json({ 
        available: false, 
        message: `Supabase error: ${error instanceof Error ? error.message : String(error)}`,
        error: true
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
