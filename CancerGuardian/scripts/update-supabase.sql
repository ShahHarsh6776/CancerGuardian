-- Add new columns to users table for enhanced profile
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phoneNumber TEXT,
ADD COLUMN IF NOT EXISTS emergencyContact JSONB,
ADD COLUMN IF NOT EXISTS medicalHistory JSONB,
ADD COLUMN IF NOT EXISTS preferences JSONB;

-- Add new columns to test_results table for enhanced diagnostics
ALTER TABLE test_results
ADD COLUMN IF NOT EXISTS detailedAnalysis JSONB,
ADD COLUMN IF NOT EXISTS aiModelVersion TEXT,
ADD COLUMN IF NOT EXISTS symptoms JSONB,
ADD COLUMN IF NOT EXISTS followUpRequired BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS followUpDate TIMESTAMP WITH TIME ZONE;

-- Add new columns to hospitals table for enhanced information
ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS emergencyServices BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS insuranceAccepted TEXT[],
ADD COLUMN IF NOT EXISTS availableEquipment TEXT[],
ADD COLUMN IF NOT EXISTS operatingHours JSONB,
ADD COLUMN IF NOT EXISTS waitingTime INTEGER;

-- Create chat_messages table for the chatbot feature
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  isBot BOOLEAN NOT NULL,
  context JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for user alerts
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- appointment, test_result, recovery, system
  read BOOLEAN DEFAULT FALSE,
  relatedEntityType TEXT, -- appointments, test_results, recovery_plans
  relatedEntityId INTEGER,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to appointments table for better scheduling
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminderSent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS virtualMeeting BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meetingLink TEXT;

-- Add new columns to recovery_plans table for better tracking
ALTER TABLE recovery_plans
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS lastUpdated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add new columns to recovery_activities table
ALTER TABLE recovery_activities
ADD COLUMN IF NOT EXISTS reminderTime TIME,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS completedAt TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_results_userid ON test_results(userId);
CREATE INDEX IF NOT EXISTS idx_appointments_userid ON appointments(userId);
CREATE INDEX IF NOT EXISTS idx_recovery_plans_userid ON recovery_plans(userId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_userid ON chat_messages(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_userid ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lastUpdated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recovery_plan_timestamp
    BEFORE UPDATE ON recovery_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
