-- Initialize schema for Cancer Guardian Application

-- Clean up existing tables if they exist
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS recovery_activities;
DROP TABLE IF EXISTS recovery_plans;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS users;

-- Create users table with enhanced profile
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  gender TEXT,
  email TEXT,
  phone_number TEXT,
  emergency_contact JSONB,
  medical_history JSONB,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_results table with enhanced diagnostics
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  test_type TEXT NOT NULL,
  cancer_type TEXT NOT NULL,
  result TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  confidence INTEGER,
  recommendations TEXT,
  questionnaire JSONB,
  image_url TEXT,
  detailed_analysis JSONB,
  ai_model_version TEXT,
  symptoms JSONB,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hospitals table with enhanced information
CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  specialties TEXT[],
  rating INTEGER,
  review_count INTEGER,
  phone TEXT,
  website TEXT,
  emergency_services BOOLEAN DEFAULT FALSE,
  insurance_accepted TEXT[],
  available_equipment TEXT[],
  operating_hours JSONB,
  waiting_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table with enhanced scheduling
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  doctor TEXT,
  specialty TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  virtual_meeting BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recovery plans table with enhanced tracking
CREATE TABLE recovery_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  test_result_id INTEGER REFERENCES test_results(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recovery activities table with enhanced monitoring
CREATE TABLE recovery_activities (
  id SERIAL PRIMARY KEY,
  recovery_plan_id INTEGER NOT NULL REFERENCES recovery_plans(id),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT,
  duration TEXT,
  completed BOOLEAN DEFAULT FALSE,
  reminder_time TIME,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table for the chatbot feature
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_bot BOOLEAN NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for user alerts
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- appointment, test_result, recovery, system
  read BOOLEAN DEFAULT FALSE,
  related_entity_type TEXT, -- appointments, test_results, recovery_plans
  related_entity_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_hospital_id ON appointments(hospital_id);
CREATE INDEX idx_recovery_plans_user_id ON recovery_plans(user_id);
CREATE INDEX idx_recovery_plans_test_result_id ON recovery_plans(test_result_id);
CREATE INDEX idx_recovery_activities_recovery_plan_id ON recovery_activities(recovery_plan_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_users_username ON users(username);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_results_timestamp
    BEFORE UPDATE ON test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_timestamp
    BEFORE UPDATE ON hospitals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recovery_plans_timestamp
    BEFORE UPDATE ON recovery_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recovery_activities_timestamp
    BEFORE UPDATE ON recovery_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample hospitals data
INSERT INTO hospitals (name, address, latitude, longitude, specialties, rating, review_count, phone, website, emergency_services, insurance_accepted, operating_hours)
VALUES
  (
    'Memorial Cancer Institute', 
    '3501 Johnson St, Hollywood, FL 33021', 
    '26.0193', 
    '-80.1734', 
    ARRAY['Oncology', 'Radiology', 'Surgery'], 
    4, 
    120, 
    '(954) 265-4325', 
    'https://www.mhs.net/services/cancer',
    TRUE,
    ARRAY['Medicare', 'Medicaid', 'Blue Cross', 'Aetna'],
    '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00"}'
  ),
  (
    'MD Anderson Cancer Center', 
    '1515 Holcombe Blvd, Houston, TX 77030', 
    '29.7070', 
    '-95.3971', 
    ARRAY['Oncology', 'Research', 'Immunotherapy'], 
    5, 
    350, 
    '(877) 632-6789', 
    'https://www.mdanderson.org/',
    TRUE,
    ARRAY['Medicare', 'Medicaid', 'United Healthcare', 'Cigna'],
    '{"monday": "7:00-19:00", "tuesday": "7:00-19:00", "wednesday": "7:00-19:00", "thursday": "7:00-19:00", "friday": "7:00-19:00", "saturday": "8:00-12:00"}'
  ),
  (
    'Mayo Clinic Cancer Center', 
    '5777 E Mayo Blvd, Phoenix, AZ 85054', 
    '33.6550', 
    '-111.9483', 
    ARRAY['Oncology', 'Precision Medicine', 'Clinical Trials'], 
    5, 
    280, 
    '(480) 301-8000', 
    'https://www.mayoclinic.org/departments-centers/mayo-clinic-cancer-center',
    TRUE,
    ARRAY['Medicare', 'Blue Cross', 'Humana', 'Kaiser'],
    '{"monday": "6:00-20:00", "tuesday": "6:00-20:00", "wednesday": "6:00-20:00", "thursday": "6:00-20:00", "friday": "6:00-18:00"}'
  ),
  (
    'Dana-Farber Cancer Institute', 
    '450 Brookline Ave, Boston, MA 02215', 
    '42.3375', 
    '-71.1073', 
    ARRAY['Oncology', 'Hematology', 'Pediatric Oncology'], 
    5, 
    310, 
    '(617) 632-3000', 
    'https://www.dana-farber.org/',
    TRUE,
    ARRAY['Medicare', 'Mass Health', 'Harvard Pilgrim', 'Tufts'],
    '{"monday": "7:30-18:00", "tuesday": "7:30-18:00", "wednesday": "7:30-18:00", "thursday": "7:30-18:00", "friday": "7:30-17:00"}'
  ),
  (
    'UCSF Helen Diller Family Comprehensive Cancer Center', 
    '1600 Divisadero St, San Francisco, CA 94115', 
    '37.7847', 
    '-122.4396', 
    ARRAY['Oncology', 'Genomics', 'Radiation Oncology'], 
    4, 
    175, 
    '(877) 887-7737', 
    'https://www.ucsfhealth.org/clinics/helen-diller-family-comprehensive-cancer-center',
    TRUE,
    ARRAY['Medicare', 'Medi-Cal', 'Blue Shield', 'Health Net'],
    '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00"}'
  );

-- Create function for password authentication
CREATE OR REPLACE FUNCTION authenticate_user(p_username TEXT, p_password TEXT)
RETURNS users AS $$
DECLARE
    user_record users;
BEGIN
    SELECT * INTO user_record
    FROM users
    WHERE username = p_username AND password = crypt(p_password, password);
    
    RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
