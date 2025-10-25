-- SAFE GROWTH SCORE MIGRATION - Startup Incubator Friendly
-- Run this in your Supabase SQL Editor

-- 1️⃣ CORE PRINCIPLES TABLE (Safe Creation)
CREATE TABLE IF NOT EXISTS core_principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credit_value INT NOT NULL DEFAULT 3,
  parameters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ GROWTH EVALUATIONS TABLE (Safe Creation)
CREATE TABLE IF NOT EXISTS growth_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  principle_id UUID REFERENCES core_principles(id) ON DELETE CASCADE,
  week DATE DEFAULT CURRENT_DATE,
  parameter_scores JSONB DEFAULT '{}'::jsonb,
  growth_grade FLOAT CHECK (growth_grade BETWEEN 0 AND 10),
  credit_value INT NOT NULL,
  growth_contribution FLOAT GENERATED ALWAYS AS (credit_value * growth_grade) STORED,
  ai_summary TEXT,
  admin_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3️⃣ PROFILE TABLE MODIFICATION (Safe Addition)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS growth_score FLOAT,
ADD COLUMN IF NOT EXISTS total_credits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank INT;

-- 4️⃣ GROWTH SCORE UPDATE FUNCTION (Safe Replacement)
CREATE OR REPLACE FUNCTION update_user_growth_score(target_user UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET growth_score = (
    SELECT
      COALESCE(SUM(g.credit_value * g.growth_grade) / NULLIF(SUM(g.credit_value), 0), 0)
    FROM growth_evaluations g
    WHERE g.user_id = target_user AND g.admin_verified = TRUE
  ),
  total_credits = (
    SELECT COALESCE(SUM(g.credit_value), 0)
    FROM growth_evaluations g
    WHERE g.user_id = target_user AND g.admin_verified = TRUE
  )
  WHERE profiles.id = target_user;
END;
$$ LANGUAGE plpgsql;

-- 5️⃣ TRIGGER FUNCTION (Safe Replacement)
CREATE OR REPLACE FUNCTION trigger_update_growth_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_verified = TRUE THEN
    PERFORM update_user_growth_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6️⃣ TRIGGER (Safe Creation)
DROP TRIGGER IF EXISTS on_growth_eval_update ON growth_evaluations;
CREATE TRIGGER on_growth_eval_update
AFTER INSERT OR UPDATE ON growth_evaluations
FOR EACH ROW
EXECUTE FUNCTION trigger_update_growth_score();

-- 7️⃣ SAMPLE CORE PRINCIPLES (Safe Insert)
INSERT INTO core_principles (name, credit_value, parameters)
VALUES
('Ownership', 3, '[{"effort": "Accountability and consistency"}, {"initiative": "Taking charge"}]'),
('Learning & Growth', 3, '[{"learning_depth": "Reflective and continuous improvement"}]'),
('Collaboration', 2, '[{"teamwork": "Participation and communication"}]'),
('Innovation', 2, '[{"creativity": "New ideas and problem-solving"}]'),
('Impact', 3, '[{"influence": "Results and outreach"}]')
ON CONFLICT (name) DO NOTHING;

-- 8️⃣ ENABLE RLS (Safe)
ALTER TABLE growth_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_principles ENABLE ROW LEVEL SECURITY;

-- 9️⃣ RLS POLICIES (Safe Creation - Drop First)
DROP POLICY IF EXISTS "Campus Leads can view their own evaluations" ON growth_evaluations;
DROP POLICY IF EXISTS "Campus Leads can create their own evaluations" ON growth_evaluations;
DROP POLICY IF EXISTS "Admins can view and update all evaluations" ON growth_evaluations;
DROP POLICY IF EXISTS "Everyone can read core principles" ON core_principles;

-- Create policies safely
CREATE POLICY "Campus Leads can view their own evaluations"
ON growth_evaluations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Campus Leads can create their own evaluations"
ON growth_evaluations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all evaluations"
ON growth_evaluations
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Everyone can read core principles"
ON core_principles
FOR SELECT USING (true);

-- ✅ Migration Complete!
