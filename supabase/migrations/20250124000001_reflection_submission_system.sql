-- ===============================================
-- EVP CAMPUS CHAMPIONS: REFLECTION SUBMISSION SYSTEM
-- ===============================================

-- 1️⃣ REFLECTIONS TABLE
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  principle TEXT NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  effort_score NUMERIC CHECK (effort_score BETWEEN 0 AND 10),
  quality_score NUMERIC CHECK (quality_score BETWEEN 0 AND 10),
  credit_value NUMERIC DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ REFLECTION QUESTIONS TABLE (for predefined questions)
CREATE TABLE IF NOT EXISTS reflection_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principle TEXT NOT NULL,
  question TEXT NOT NULL,
  credit_value NUMERIC DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3️⃣ INSERT SAMPLE REFLECTION QUESTIONS
INSERT INTO reflection_questions (principle, question, credit_value, order_index) VALUES
-- Ownership Questions
('Ownership', 'What''s something you took ownership of this week?', 1, 1),
('Ownership', 'Describe a situation where you stepped up as a leader.', 1, 2),
('Ownership', 'How did you take responsibility for a project or task?', 1, 3),

-- Learning by Doing Questions
('Learning by Doing', 'What new skill or knowledge did you gain through hands-on experience?', 1, 1),
('Learning by Doing', 'Describe a mistake you made and what you learned from it.', 1, 2),
('Learning by Doing', 'How did you apply theoretical knowledge in a practical setting?', 1, 3),

-- Collaboration Questions
('Collaboration', 'Describe a successful team project you were part of.', 1, 1),
('Collaboration', 'How did you help a teammate overcome a challenge?', 1, 2),
('Collaboration', 'What role did you play in fostering team communication?', 1, 3),

-- Innovation Questions
('Innovation', 'What creative solution did you come up with for a problem?', 1, 1),
('Innovation', 'How did you think outside the box this week?', 1, 2),
('Innovation', 'Describe an idea you proposed or implemented.', 1, 3),

-- Impact Questions
('Impact', 'How did your actions positively affect others this week?', 1, 1),
('Impact', 'What measurable results did you achieve?', 1, 2),
('Impact', 'How did you contribute to your community or organization?', 1, 3)
ON CONFLICT DO NOTHING;

-- 4️⃣ UPDATE FUNCTION FOR REFLECTIONS
CREATE OR REPLACE FUNCTION update_reflection_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- If effort_score and quality_score are provided, calculate credit_value
  IF NEW.effort_score IS NOT NULL AND NEW.quality_score IS NOT NULL THEN
    NEW.credit_value = (NEW.effort_score + NEW.quality_score) / 2;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5️⃣ TRIGGER TO UPDATE REFLECTION SCORES
DROP TRIGGER IF EXISTS on_reflection_update ON reflections;
CREATE TRIGGER on_reflection_update
  BEFORE INSERT OR UPDATE ON reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_reflection_scores();

-- 6️⃣ SECURITY (RLS)
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_questions ENABLE ROW LEVEL SECURITY;

-- Campus Leads can view and insert their own reflections
CREATE POLICY "Campus Leads can manage their own reflections"
ON reflections
FOR ALL
USING (auth.uid() = user_id);

-- Admins can view all reflections
CREATE POLICY "Admins can view all reflections"
ON reflections
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- Everyone can read reflection questions
CREATE POLICY "Everyone can read reflection questions"
ON reflection_questions
FOR SELECT USING (true);

-- 7️⃣ INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_principle ON reflections(principle);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at);
CREATE INDEX IF NOT EXISTS idx_reflection_questions_principle ON reflection_questions(principle);

-- Done ✅
