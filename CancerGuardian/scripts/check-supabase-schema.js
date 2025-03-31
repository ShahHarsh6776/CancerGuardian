// This script checks the Supabase schema to ensure it matches our application's needs

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials in environment variables');
  console.error('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('Checking Supabase tables...');
  
  try {
    // Get list of all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      throw new Error(`Error fetching tables: ${tablesError.message}`);
    }
    
    const tableNames = tables.map(t => t.table_name);
    console.log('Available tables:', tableNames);
    
    // Expected tables
    const expectedTables = [
      'users', 
      'test_results', 
      'hospitals', 
      'appointments', 
      'recovery_plans', 
      'recovery_activities'
    ];
    
    for (const table of expectedTables) {
      if (!tableNames.includes(table)) {
        console.error(`Missing table: ${table}`);
      } else {
        console.log(`✓ Table exists: ${table}`);
        await checkColumns(table);
      }
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

async function checkColumns(tableName) {
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      throw new Error(`Error fetching columns for ${tableName}: ${error.message}`);
    }
    
    console.log(`  Columns for ${tableName}:`);
    columns.forEach(column => {
      console.log(`    - ${column.column_name} (${column.data_type})`);
    });
  } catch (error) {
    console.error(`Error checking columns for ${tableName}:`, error);
  }
}

async function main() {
  try {
    console.log('Connecting to Supabase...');
    
    // Basic connection check
    const { data, error } = await supabase.from('users').select('count()', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Connection error: ${error.message}`);
    }
    
    console.log('✓ Successfully connected to Supabase');
    await checkTables();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();