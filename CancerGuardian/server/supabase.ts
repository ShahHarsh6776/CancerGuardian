import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase configuration:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User operations
export async function getUserById(id: number) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data || undefined;
}

export async function createUser(userData: any) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Test results operations
export async function createTestResult(resultData: any) {
  const { data, error } = await supabase
    .from('test_results')
    .insert(resultData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserTestResults(userId: number) {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error retrieving test results:', error);
    throw error;
  }
}

export async function getTestResultById(id: number) {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Hospital operations
export async function getHospitals() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function getHospitalById(id: number) {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Appointment operations
export async function createAppointment(appointmentData: any) {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserAppointments(userId: number) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, hospitals(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error retrieving appointments:', error);
    throw error;
  }
}

export async function updateAppointmentStatus(id: number, status: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Recovery plan operations
export async function createRecoveryPlan(planData: any) {
  const { data, error } = await supabase
    .from('recovery_plans')
    .insert(planData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserRecoveryPlans(userId: number) {
  try {
    const { data, error } = await supabase
      .from('recovery_plans')
      .select('*, recovery_activities(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error retrieving recovery plans:', error);
    throw error;
  }
}

export async function addRecoveryActivity(activityData: any) {
  const { data, error } = await supabase
    .from('recovery_activities')
    .insert(activityData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecoveryActivity(id: number, updates: any) {
  const { data, error } = await supabase
    .from('recovery_activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}