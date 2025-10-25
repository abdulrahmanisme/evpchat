-- ===============================================
-- EVP CAMPUS CHAMPIONS: ENHANCED EVALUATION METRICS
-- ===============================================

-- 1️⃣ ADD NEW METRIC COLUMNS TO REFLECTIONS TABLE
ALTER TABLE reflections 
ADD COLUMN IF NOT EXISTS depth_score NUMERIC,
ADD COLUMN IF NOT EXISTS scale_score NUMERIC,
ADD COLUMN IF NOT EXISTS principle_avg_score NUMERIC;

-- 2️⃣ UPDATE USER_GPA TABLE WITH NEW METRICS
ALTER TABLE user_gpa 
ADD COLUMN IF NOT EXISTS total_depth_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_scale_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_depth_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_scale_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_principle_scores JSONB DEFAULT '{}';

-- 3️⃣ DEFINE PRINCIPLE CREDIT WEIGHTS
CREATE OR REPLACE FUNCTION get_principle_credits(principle_name TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE principle_name
    WHEN 'Ownership' THEN 4
    WHEN 'Learning by Doing' THEN 3
    WHEN 'Collaboration' THEN 3
    WHEN 'Innovation' THEN 2
    WHEN 'Impact' THEN 3
    ELSE 2 -- Default weight for unknown principles
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4️⃣ UPDATED COMPUTE GPA FUNCTION WITH CREDIT WEIGHTS
CREATE OR REPLACE FUNCTION compute_gpa(target_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  reflection_record RECORD;
  calculated_gpa NUMERIC;
  user_rank INTEGER;
  total_weighted_points NUMERIC := 0;
  total_credits NUMERIC := 0;
  avg_principle_scores JSONB := '{}';
  principle_avg NUMERIC;
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

  -- Calculate credit-weighted GPA
  FOR reflection_record IN
    SELECT 
      principle,
      effort_score,
      quality_score,
      depth_score,
      scale_score
    FROM reflections
    WHERE user_id = target_user_id
      AND effort_score IS NOT NULL
      AND quality_score IS NOT NULL
      AND depth_score IS NOT NULL
      AND scale_score IS NOT NULL
  LOOP
    -- Calculate average score for this principle reflection (all 4 metrics)
    principle_avg := (
      COALESCE(reflection_record.effort_score, 0) +
      COALESCE(reflection_record.quality_score, 0) +
      COALESCE(reflection_record.depth_score, 0) +
      COALESCE(reflection_record.scale_score, 0)
    ) / 4.0;

    -- Get credit weight for this principle
    DECLARE
      principle_credits NUMERIC := get_principle_credits(reflection_record.principle);
    BEGIN
      total_weighted_points := total_weighted_points + (principle_avg * principle_credits);
      total_credits := total_credits + principle_credits;
    END;

    -- Track average scores per principle
    IF avg_principle_scores->>reflection_record.principle IS NULL THEN
      avg_principle_scores := avg_principle_scores || jsonb_build_object(reflection_record.principle, jsonb_build_object(
        'sum', principle_avg,
        'count', 1
      ));
    ELSE
      avg_principle_scores := avg_principle_scores || jsonb_build_object(reflection_record.principle, jsonb_build_object(
        'sum', (avg_principle_scores->reflection_record.principle->>'sum')::NUMERIC + principle_avg,
        'count', (avg_principle_scores->reflection_record.principle->>'count')::NUMERIC + 1
      ));
    END IF;
  END LOOP;

  -- Calculate final GPA (average score across all principles)
  IF total_credits > 0 THEN
    calculated_gpa := total_weighted_points / total_credits;
  ELSE
    calculated_gpa := 0;
  END IF;

  -- Calculate rank based on weighted GPA
  SELECT COUNT(*) + 1 INTO user_rank
  FROM user_gpa 
  WHERE weighted_gpa > calculated_gpa;

  -- Calculate average scores per principle
  DECLARE
    principle_name TEXT;
    principle_data JSONB;
  BEGIN
    FOR principle_name IN SELECT jsonb_object_keys(avg_principle_scores)
    LOOP
      principle_data := avg_principle_scores->principle_name;
      avg_principle_scores := avg_principle_scores || jsonb_build_object(principle_name, 
        (principle_data->>'sum')::NUMERIC / (principle_data->>'count')::NUMERIC
      );
    END LOOP;
  END;

  -- Insert or update user GPA record
  INSERT INTO user_gpa (
    user_id,
    total_reflections,
    total_effort_score,
    total_quality_score,
    average_effort_score,
    average_quality_score,
    total_depth_score,
    total_scale_score,
    average_depth_score,
    average_scale_score,
    avg_principle_scores,
    weighted_gpa,
    rank,
    last_calculated,
    updated_at
  )
  VALUES (
    target_user_id,
    (SELECT COUNT(*) FROM reflections WHERE user_id = target_user_id AND effort_score IS NOT NULL),
    (SELECT COALESCE(SUM(effort_score), 0) FROM reflections WHERE user_id = target_user_id),
    (SELECT COALESCE(SUM(quality_score), 0) FROM reflections WHERE user_id = target_user_id),
    (SELECT COALESCE(AVG(effort_score), 0) FROM reflections WHERE user_id = target_user_id AND effort_score IS NOT NULL),
    (SELECT COALESCE(AVG(quality_score), 0) FROM reflections WHERE user_id = target_user_id AND quality_score IS NOT NULL),
    (SELECT COALESCE(SUM(depth_score), 0) FROM reflections WHERE user_id = target_user_id),
    (SELECT COALESCE(SUM(scale_score), 0) FROM reflections WHERE user_id = target_user_id),
    (SELECT COALESCE(AVG(depth_score), 0) FROM reflections WHERE user_id = target_user_id AND depth_score IS NOT NULL),
    (SELECT COALESCE(AVG(scale_score), 0) FROM reflections WHERE user_id = target_user_id AND scale_score IS NOT NULL),
    avg_principle_scores,
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
    total_depth_score = EXCLUDED.total_depth_score,
    total_scale_score = EXCLUDED.total_scale_score,
    average_depth_score = EXCLUDED.average_depth_score,
    average_scale_score = EXCLUDED.average_scale_score,
    avg_principle_scores = EXCLUDED.avg_principle_scores,
    weighted_gpa = EXCLUDED.weighted_gpa,
    rank = EXCLUDED.rank,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = NOW();

  -- Update ranks for all users after this change
  PERFORM update_all_ranks();
END;
$$ LANGUAGE plpgsql;

-- 5️⃣ UPDATE TRIGGER TO CHECK ALL 4 METRICS
CREATE OR REPLACE FUNCTION trigger_compute_gpa()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when all 4 metrics are set
  IF NEW.effort_score IS NOT NULL 
     AND NEW.quality_score IS NOT NULL 
     AND NEW.depth_score IS NOT NULL 
     AND NEW.scale_score IS NOT NULL THEN
    
    -- Calculate principle average score
    NEW.principle_avg_score := (
      COALESCE(NEW.effort_score, 0) +
      COALESCE(NEW.quality_score, 0) +
      COALESCE(NEW.depth_score, 0) +
      COALESCE(NEW.scale_score, 0)
    ) / 4.0;
    
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

-- Done ✅
