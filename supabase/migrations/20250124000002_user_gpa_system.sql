-- ===============================================
-- EVP CAMPUS CHAMPIONS: USER GPA SYSTEM
-- ===============================================

-- 1️⃣ USER GPA TABLE
CREATE TABLE IF NOT EXISTS user_gpa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_reflections INTEGER DEFAULT 0,
  total_effort_score NUMERIC DEFAULT 0,
  total_quality_score NUMERIC DEFAULT 0,
  average_effort_score NUMERIC DEFAULT 0,
  average_quality_score NUMERIC DEFAULT 0,
  weighted_gpa NUMERIC DEFAULT 0,
  rank INTEGER,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ COMPUTE GPA FUNCTION
CREATE OR REPLACE FUNCTION compute_gpa(target_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  reflection_stats RECORD;
  calculated_gpa NUMERIC;
  user_rank INTEGER;
BEGIN
  -- If no specific user provided, calculate for all users
  IF target_user_id IS NULL THEN
    FOR user_record IN 
      SELECT DISTINCT user_id FROM reflections WHERE user_id IS NOT NULL
    LOOP
      PERFORM compute_gpa(user_record.user_id);
    END LOOP;
    RETURN;
  END IF;

  -- Calculate reflection statistics for the user
  SELECT 
    COUNT(*) as total_reflections,
    COALESCE(SUM(effort_score), 0) as total_effort_score,
    COALESCE(SUM(quality_score), 0) as total_quality_score,
    COALESCE(AVG(effort_score), 0) as average_effort_score,
    COALESCE(AVG(quality_score), 0) as average_quality_score,
    COALESCE(SUM(credit_value), 0) as total_credits
  INTO reflection_stats
  FROM reflections 
  WHERE user_id = target_user_id 
    AND effort_score IS NOT NULL 
    AND quality_score IS NOT NULL;

  -- Calculate weighted GPA (effort + quality + credits)
  calculated_gpa := (
    reflection_stats.average_effort_score * 0.4 + 
    reflection_stats.average_quality_score * 0.4 + 
    LEAST(reflection_stats.total_credits / 10.0, 2.0) * 0.2
  );

  -- Calculate rank based on weighted GPA
  SELECT COUNT(*) + 1 INTO user_rank
  FROM user_gpa 
  WHERE weighted_gpa > calculated_gpa;

  -- Insert or update user GPA record
  INSERT INTO user_gpa (
    user_id, 
    total_reflections, 
    total_effort_score, 
    total_quality_score,
    average_effort_score,
    average_quality_score,
    weighted_gpa,
    rank,
    last_calculated,
    updated_at
  )
  VALUES (
    target_user_id,
    reflection_stats.total_reflections,
    reflection_stats.total_effort_score,
    reflection_stats.total_quality_score,
    reflection_stats.average_effort_score,
    reflection_stats.average_quality_score,
    calculated_gpa,
    user_rank,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_reflections = EXCLUDED.total_reflections,
    total_effort_score = EXCLUDED.total_effort_score,
    total_quality_score = EXCLUDED.total_quality_score,
    average_effort_score = EXCLUDED.average_effort_score,
    average_quality_score = EXCLUDED.average_quality_score,
    weighted_gpa = EXCLUDED.weighted_gpa,
    rank = EXCLUDED.rank,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = NOW();

  -- Update ranks for all users after this change
  PERFORM update_all_ranks();
END;
$$ LANGUAGE plpgsql;

-- 3️⃣ UPDATE ALL RANKS FUNCTION
CREATE OR REPLACE FUNCTION update_all_ranks()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  current_rank INTEGER := 1;
BEGIN
  -- Update ranks based on weighted GPA (descending order)
  FOR user_record IN 
    SELECT user_id, weighted_gpa
    FROM user_gpa 
    ORDER BY weighted_gpa DESC, total_reflections DESC, last_calculated ASC
  LOOP
    UPDATE user_gpa 
    SET rank = current_rank, updated_at = NOW()
    WHERE user_id = user_record.user_id;
    
    current_rank := current_rank + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ TRIGGER TO AUTO-COMPUTE GPA WHEN REFLECTION IS EVALUATED
CREATE OR REPLACE FUNCTION trigger_compute_gpa()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when effort_score and quality_score are both set
  IF NEW.effort_score IS NOT NULL AND NEW.quality_score IS NOT NULL THEN
    PERFORM compute_gpa(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reflection_evaluated ON reflections;
CREATE TRIGGER on_reflection_evaluated
  AFTER INSERT OR UPDATE ON reflections
  FOR EACH ROW
  EXECUTE FUNCTION trigger_compute_gpa();

-- 5️⃣ SECURITY (RLS)
ALTER TABLE user_gpa ENABLE ROW LEVEL SECURITY;

-- Users can view their own GPA
CREATE POLICY "Users can view their own GPA"
ON user_gpa
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all GPAs
CREATE POLICY "Admins can view all GPAs"
ON user_gpa
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- 6️⃣ INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_gpa_user_id ON user_gpa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gpa_weighted_gpa ON user_gpa(weighted_gpa DESC);
CREATE INDEX IF NOT EXISTS idx_user_gpa_rank ON user_gpa(rank);

-- 7️⃣ INITIAL GPA CALCULATION FOR EXISTING USERS
-- This will calculate GPA for all users who have reflections
SELECT compute_gpa();

-- Done ✅
