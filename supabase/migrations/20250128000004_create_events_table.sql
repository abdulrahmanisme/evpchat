-- Create events table for admin/superadmin event management

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'workshop', 'event')),
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Admins and SuperAdmins can manage all events
CREATE POLICY "Admins can manage all events"
ON events
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- Campus Leads can view all events
CREATE POLICY "Campus Leads can view all events"
ON events
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'campus_lead'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

COMMENT ON TABLE events IS 'Events created by admins and superadmins for campus leads';
COMMENT ON COLUMN events.type IS 'Event type: meeting, workshop, or event';
COMMENT ON COLUMN events.created_by IS 'User ID of the admin/superadmin who created the event';
