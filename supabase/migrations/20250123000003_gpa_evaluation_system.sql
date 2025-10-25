-- Credit-Based Growth Evaluation System (GPA Model)
-- This migration adds the GPA evaluation system to EVP Campus Champions

-- Create core_principles table
CREATE TABLE public.core_principles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  max_credits INTEGER NOT NULL DEFAULT 100,
  parameters JSONB NOT NULL DEFAULT '{}',
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create growth_evaluations table
CREATE TABLE public.growth_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  principle_id UUID REFERENCES public.core_principles(id) ON DELETE CASCADE NOT NULL,
  reflection_text TEXT NOT NULL,
  effort_score INTEGER NOT NULL CHECK (effort_score >= 1 AND effort_score <= 5),
  credits_earned DECIMAL(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_comments TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add GPA-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gpa DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN rank INTEGER DEFAULT 0,
ADD COLUMN total_credits DECIMAL(8,2) DEFAULT 0.00,
ADD COLUMN attendance_count INTEGER DEFAULT 0;

-- Create attendance table for tracking event attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  attendance_type TEXT NOT NULL DEFAULT 'event' CHECK (attendance_type IN ('event', 'meeting', 'workshop', 'training')),
  credits_earned DECIMAL(5,2) NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert core principles
INSERT INTO public.core_principles (name, description, max_credits, parameters, weight) VALUES
('Ownership', 'Taking responsibility and initiative in campus activities', 100, '{"attendance_weight": 0.3, "reflection_weight": 0.7}', 1.00),
('Innovation', 'Bringing creative solutions and new ideas', 100, '{"creativity_score": 0.4, "implementation_score": 0.6}', 1.00),
('Collaboration', 'Working effectively with others', 100, '{"teamwork_score": 0.5, "communication_score": 0.5}', 1.00),
('Excellence', 'Maintaining high standards and continuous improvement', 100, '{"quality_score": 0.6, "improvement_score": 0.4}', 1.00),
('Impact', 'Creating meaningful change and measurable results', 100, '{"reach_score": 0.5, "outcome_score": 0.5}', 1.00);

-- Enable RLS on new tables
ALTER TABLE public.core_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for core_principles
CREATE POLICY "Everyone can view core principles"
  ON public.core_principles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage core principles"
  ON public.core_principles FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for growth_evaluations
CREATE POLICY "Users can view their own evaluations"
  ON public.growth_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evaluations"
  ON public.growth_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all evaluations"
  ON public.growth_evaluations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can update all evaluations"
  ON public.growth_evaluations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance"
  ON public.attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attendance records"
  ON public.attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
  ON public.attendance FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can update all attendance"
  ON public.attendance FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Create function to calculate GPA
CREATE OR REPLACE FUNCTION public.calculate_gpa(user_uuid UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_weighted_credits DECIMAL(8,2) := 0;
  total_max_credits DECIMAL(8,2) := 0;
  principle_record RECORD;
  user_credits DECIMAL(5,2);
BEGIN
  -- Get all active principles and their weights
  FOR principle_record IN 
    SELECT id, max_credits, weight 
    FROM public.core_principles 
    WHERE is_active = true
  LOOP
    -- Calculate credits earned for this principle
    SELECT COALESCE(SUM(credits_earned), 0)
    INTO user_credits
    FROM public.growth_evaluations
    WHERE user_id = user_uuid 
      AND principle_id = principle_record.id 
      AND status = 'verified';
    
    -- Add to weighted totals
    total_weighted_credits := total_weighted_credits + (user_credits * principle_record.weight);
    total_max_credits := total_max_credits + (principle_record.max_credits * principle_record.weight);
  END LOOP;
  
  -- Calculate GPA (scale 0.00 to 4.00)
  IF total_max_credits > 0 THEN
    RETURN LEAST(4.00, (total_weighted_credits / total_max_credits) * 4.00);
  ELSE
    RETURN 0.00;
  END IF;
END;
$$;

-- Create function to update user GPA and rank
CREATE OR REPLACE FUNCTION public.update_user_gpa_and_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_gpa DECIMAL(3,2);
  new_total_credits DECIMAL(8,2);
  new_rank INTEGER;
BEGIN
  -- Calculate new GPA and total credits
  SELECT public.calculate_gpa(NEW.user_id) INTO new_gpa;
  
  SELECT COALESCE(SUM(credits_earned), 0)
  INTO new_total_credits
  FROM public.growth_evaluations
  WHERE user_id = NEW.user_id AND status = 'verified';
  
  -- Update profile
  UPDATE public.profiles
  SET 
    gpa = new_gpa,
    total_credits = new_total_credits,
    updated_at = now()
  WHERE id = NEW.user_id;
  
  -- Update rank based on GPA
  WITH ranked_users AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY gpa DESC, total_credits DESC) as rank_num
    FROM public.profiles
    WHERE gpa > 0
  )
  UPDATE public.profiles
  SET rank = ranked_users.rank_num
  FROM ranked_users
  WHERE profiles.id = ranked_users.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update GPA when evaluations change
CREATE TRIGGER update_gpa_on_evaluation_change
  AFTER INSERT OR UPDATE OR DELETE ON public.growth_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_gpa_and_rank();

-- Create function to calculate credits for effort score
CREATE OR REPLACE FUNCTION public.calculate_effort_credits(effort_score INTEGER, max_credits DECIMAL(5,2))
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Convert effort score (1-5) to credits (0-max_credits)
  -- 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%
  RETURN (effort_score - 1) * (max_credits / 4.0);
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_growth_evaluations_user_id ON public.growth_evaluations(user_id);
CREATE INDEX idx_growth_evaluations_principle_id ON public.growth_evaluations(principle_id);
CREATE INDEX idx_growth_evaluations_status ON public.growth_evaluations(status);
CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX idx_profiles_gpa ON public.profiles(gpa DESC);
CREATE INDEX idx_profiles_rank ON public.profiles(rank);
