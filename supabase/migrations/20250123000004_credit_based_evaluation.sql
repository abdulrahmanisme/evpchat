-- ===============================================
-- EVP CAMPUS CHAMPIONS: CREDIT-BASED EVALUATION SYSTEM
-- ===============================================

-- 1️⃣ CORE PRINCIPLES TABLE
CREATE TABLE IF NOT EXISTS core_principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credit_value INT NOT NULL DEFAULT 3,
  parameters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ GROWTH EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS growth_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  principle_id UUID REFERENCES core_principles(id) ON DELETE CASCADE,
  week DATE DEFAULT CURRENT_DATE,
  parameter_scores JSONB DEFAULT '{}'::jsonb,
  growth_grade FLOAT CHECK (growth_grade BETWEEN 0 AND 10),
  credit_value INT NOT NULL,
  gpa_contribution FLOAT GENERATED ALWAYS AS (credit_value * growth_grade) STORED,
  ai_summary TEXT,
  admin_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3️⃣ PROFILE TABLE MODIFICATION
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gpa FLOAT,
ADD COLUMN IF NOT EXISTS total_credits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank INT;

-- 4️⃣ GPA UPDATE FUNCTION
CREATE OR REPLACE FUNCTION update_user_gpa(target_user UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET gpa = (
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

-- 5️⃣ TRIGGER TO AUTO UPDATE GPA WHEN ADMIN VERIFIES
CREATE OR REPLACE FUNCTION trigger_update_gpa()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_verified = TRUE THEN
    PERFORM update_user_gpa(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_growth_eval_update ON growth_evaluations;
CREATE TRIGGER on_growth_eval_update
AFTER INSERT OR UPDATE ON growth_evaluations
FOR EACH ROW
EXECUTE FUNCTION trigger_update_gpa();

-- 6️⃣ SAMPLE CORE PRINCIPLES (SEED DATA)
INSERT INTO core_principles (name, credit_value, parameters)
VALUES
('Ownership', 3, '[{"effort": "Accountability and consistency"}, {"initiative": "Taking charge"}]'),
('Learning & Growth', 3, '[{"learning_depth": "Reflective and continuous improvement"}]'),
('Collaboration', 2, '[{"teamwork": "Participation and communication"}]'),
('Innovation', 2, '[{"creativity": "New ideas and problem-solving"}]'),
('Impact', 3, '[{"influence": "Results and outreach"}]')
ON CONFLICT DO NOTHING;

-- 7️⃣ SECURITY (RLS)
ALTER TABLE growth_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_principles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campus Leads can view their own evaluations"
ON growth_evaluations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all evaluations"
ON growth_evaluations
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can read core principles"
ON core_principles
FOR SELECT USING (true);

-- Done ✅
