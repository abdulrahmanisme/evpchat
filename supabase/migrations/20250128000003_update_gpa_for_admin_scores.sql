-- Update compute_gpa function to use admin override scores when available

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
  -- Use admin scores if available, otherwise use AI scores
  SELECT 
    COUNT(*) as total_reflections,
    COALESCE(SUM(COALESCE(admin_effort_score, effort_score)), 0) as total_effort_score,
    COALESCE(SUM(COALESCE(admin_quality_score, quality_score)), 0) as total_quality_score,
    COALESCE(AVG(COALESCE(admin_effort_score, effort_score)), 0) as average_effort_score,
    COALESCE(AVG(COALESCE(admin_quality_score, quality_score)), 0) as average_quality_score,
    COALESCE(SUM(credit_value), 0) as total_credits
  INTO reflection_stats
  FROM reflections 
  WHERE user_id = target_user_id 
    AND (effort_score IS NOT NULL OR admin_effort_score IS NOT NULL)
    AND (quality_score IS NOT NULL OR admin_quality_score IS NOT NULL);

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

-- Also update the trigger to recalculate when admin scores are updated
CREATE OR REPLACE FUNCTION trigger_compute_gpa()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger when AI scores OR admin scores are set/updated
  IF (
    (NEW.effort_score IS NOT NULL OR NEW.admin_effort_score IS NOT NULL) AND
    (NEW.quality_score IS NOT NULL OR NEW.admin_quality_score IS NOT NULL)
  ) THEN
    PERFORM compute_gpa(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION compute_gpa IS 'Calculates GPA using admin override scores when available, otherwise uses AI scores';
