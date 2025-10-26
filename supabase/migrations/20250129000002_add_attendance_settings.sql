-- Add attendance settings table to control whether campus leads can update attendance
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default setting: allow campus leads to update attendance
INSERT INTO public.attendance_settings (setting_key, setting_value, description)
VALUES ('allow_campus_leads_update', true, 'Allow campus leads to update their own office attendance')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read attendance settings (campus leads need to check if they can update)
CREATE POLICY "Everyone can read attendance settings"
  ON public.attendance_settings FOR SELECT
  USING (true);

-- Only admins and superadmins can update settings
CREATE POLICY "Admins can manage attendance settings"
  ON public.attendance_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Add function to update setting
CREATE OR REPLACE FUNCTION update_attendance_setting(
  _setting_key TEXT,
  _setting_value BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.attendance_settings
  SET 
    setting_value = _setting_value,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE setting_key = _setting_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

