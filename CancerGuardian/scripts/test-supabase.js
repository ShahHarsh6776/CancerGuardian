// A simple script to test the Supabase connection
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Check if Supabase credentials are provided
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

console.log('Supabase credentials found, testing connection...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
async function testConnection() {
  try {
    // Try to fetch the current timestamp from the database
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log('✓ Successfully connected to Supabase!');
    console.log(`Found ${count || 0} user records`);
    
    // Check if hospitals table exists
    const { data: hospitals, error: hospitalsError, count: hospitalCount } = await supabase
      .from('hospitals')
      .select('*', { count: 'exact', head: true });
    
    if (hospitalsError) {
      console.log('✗ Hospitals table not found or inaccessible');
      console.log('Have you run the database.sql file in your Supabase project?');
    } else {
      console.log(`✓ Found ${hospitalCount || 0} hospital records`);
    }
    
  } catch (error) {
    console.error('Error connecting to Supabase:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();