-- Initialize schema for Supabase

-- Clean up existing tables if they exist
DROP TABLE IF EXISTS recovery_activities;
DROP TABLE IF EXISTS recovery_plans;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  gender TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_results table
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  testType TEXT NOT NULL,
  cancerType TEXT NOT NULL,
  result TEXT NOT NULL,
  riskLevel TEXT NOT NULL,
  confidence INTEGER,
  recommendations TEXT,
  questionnaire JSONB,
  imageUrl TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hospitals table
CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  specialties TEXT[],
  rating INTEGER,
  reviewCount INTEGER,
  phone TEXT,
  website TEXT
);

-- Create appointments table
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  hospitalId INTEGER NOT NULL REFERENCES hospitals(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  reason TEXT,
  doctor TEXT,
  specialty TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recovery plans table
CREATE TABLE recovery_plans (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  testResultId INTEGER REFERENCES test_results(id),
  title TEXT NOT NULL,
  description TEXT,
  startDate TIMESTAMP WITH TIME ZONE,
  endDate TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recovery activities table
CREATE TABLE recovery_activities (
  id SERIAL PRIMARY KEY,
  recoveryPlanId INTEGER NOT NULL REFERENCES recovery_plans(id),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT,
  duration TEXT,
  completed BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample hospitals data
INSERT INTO hospitals (name, address, latitude, longitude, specialties, rating, reviewCount, phone, website)
VALUES
  ('Memorial Cancer Institute', '3501 Johnson St, Hollywood, FL 33021', '26.0193', '-80.1734', ARRAY['Oncology', 'Radiology', 'Surgery'], 4, 120, '(954) 265-4325', 'https://www.mhs.net/services/cancer'),
  ('MD Anderson Cancer Center', '1515 Holcombe Blvd, Houston, TX 77030', '29.7070', '-95.3971', ARRAY['Oncology', 'Research', 'Immunotherapy'], 5, 350, '(877) 632-6789', 'https://www.mdanderson.org/'),
  ('Mayo Clinic Cancer Center', '5777 E Mayo Blvd, Phoenix, AZ 85054', '33.6550', '-111.9483', ARRAY['Oncology', 'Precision Medicine', 'Clinical Trials'], 5, 280, '(480) 301-8000', 'https://www.mayoclinic.org/departments-centers/mayo-clinic-cancer-center'),
  ('Dana-Farber Cancer Institute', '450 Brookline Ave, Boston, MA 02215', '42.3375', '-71.1073', ARRAY['Oncology', 'Hematology', 'Pediatric Oncology'], 5, 310, '(617) 632-3000', 'https://www.dana-farber.org/'),
  ('UCSF Helen Diller Family Comprehensive Cancer Center', '1600 Divisadero St, San Francisco, CA 94115', '37.7847', '-122.4396', ARRAY['Oncology', 'Genomics', 'Radiation Oncology'], 4, 175, '(877) 887-7737', 'https://www.ucsfhealth.org/clinics/helen-diller-family-comprehensive-cancer-center');