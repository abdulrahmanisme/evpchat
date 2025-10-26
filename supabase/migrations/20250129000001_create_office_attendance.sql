-- Create office_attendance table for campus leads to mark office check-in
CREATE TABLE IF NOT EXISTS public.office_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_date DATE NOT NULL,
  checked_in BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_office_attendance_user_date ON public.office_attendance(user_id, check_date);

-- Enable RLS
ALTER TABLE public.office_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own office attendance
CREATE POLICY "Users can view their own office attendance"
  ON public.office_attendance FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own office attendance
CREATE POLICY "Users can insert their own office attendance"
  ON public.office_attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own office attendance
CREATE POLICY "Users can update their own office attendance"
  ON public.office_attendance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all office attendance
CREATE POLICY "Admins can view all office attendance"
  ON public.office_attendance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Admins can update all office attendance
CREATE POLICY "Admins can update all office attendance"
  ON public.office_attendance FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Admins can insert office attendance records
CREATE POLICY "Admins can insert office attendance"
  ON public.office_attendance FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_office_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_office_attendance_timestamp
  BEFORE UPDATE ON public.office_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_office_attendance_updated_at();

