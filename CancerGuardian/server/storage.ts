import { 
  type User, 
  type InsertUser, 
  type TestResult, 
  type InsertTestResult,
  type Hospital
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import * as supabaseClient from './supabase';

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Test results operations
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  getUserTestResults(userId: number): Promise<TestResult[]>;
  getTestResultById(id: number): Promise<TestResult | undefined>;
  
  // Hospital operations
  getHospitals(): Promise<Hospital[]>;
  getHospitalById(id: number): Promise<Hospital | undefined>;
  
  // Session store
  sessionStore: any;
}

// Supabase storage implementation
class SupabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  async getUser(id: number) {
    return await supabaseClient.getUserById(id);
  }

  async getUserByUsername(username: string) {
    return await supabaseClient.getUserByUsername(username);
  }

  async createUser(user: InsertUser) {
    return await supabaseClient.createUser(user);
  }

  async createTestResult(result: InsertTestResult) {
    return await supabaseClient.createTestResult(result);
  }

  async getUserTestResults(userId: number) {
    return await supabaseClient.getUserTestResults(userId);
  }

  async getTestResultById(id: number) {
    return await supabaseClient.getTestResultById(id);
  }

  async getHospitals() {
    return await supabaseClient.getHospitals();
  }

  async getHospitalById(id: number) {
    return await supabaseClient.getHospitalById(id);
  }
}

// Export a single instance of SupabaseStorage
export const storage = new SupabaseStorage();