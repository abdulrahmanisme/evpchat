-- Update attendance table structure for calendar integration
-- This migration ensures the attendance table works properly with the calendar feature

-- Add missing columns if they don't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Update the credits_earned column to allow decimal values
ALTER TABLE attendance 
ALTER COLUMN credits_earned TYPE DECIMAL(5,2);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_attendance_event_name ON attendance(event_name);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can create their own attendance records" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can update all attendance" ON attendance;

-- Create updated RLS policies
CREATE POLICY "Users can view their own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attendance records"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
  ON attendance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Admins can update all attendance"
  ON attendance FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- Add comments for documentation
COMMENT ON TABLE attendance IS 'Tracks campus lead attendance at events for credit calculation';
COMMENT ON COLUMN attendance.credits_earned IS 'Credits earned for attending the event (0 for not attended, 1+ for attended)';
COMMENT ON COLUMN attendance.verified_at IS 'Timestamp when attendance was verified';
COMMENT ON COLUMN attendance.verified_by IS 'User ID who verified the attendance';
