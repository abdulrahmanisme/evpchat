-- ===============================================
-- REMOVE LEGACY AND GROWTH LEADERBOARD SYSTEMS
-- ===============================================

-- This migration removes the old GPA/growth_score system since we're using
-- the reflection-based system with user_gpa table instead

-- 1️⃣ DROP GROWTH EVALUATIONS TABLE (if exists)
DROP TABLE IF EXISTS growth_evaluations CASCADE;

-- 2️⃣ DROP CORE PRINCIPLES TABLE (if exists)
DROP TABLE IF EXISTS core_principles CASCADE;

-- 3️⃣ REMOVE GPA/GROWTH_SCORE COLUMNS FROM PROFILES TABLE
ALTER TABLE profiles 
DROP COLUMN IF EXISTS gpa,
DROP COLUMN IF EXISTS growth_score,
DROP COLUMN IF EXISTS total_credits,
DROP COLUMN IF EXISTS rank;

-- 4️⃣ DROP GPA UPDATE FUNCTIONS (if exist)
DROP FUNCTION IF EXISTS update_user_gpa(UUID);
DROP FUNCTION IF EXISTS update_user_growth_score(UUID);
DROP FUNCTION IF EXISTS trigger_update_gpa();
DROP FUNCTION IF EXISTS trigger_update_growth_score();

-- 5️⃣ DROP TRIGGERS (if exist)
DROP TRIGGER IF EXISTS on_growth_evaluation_update ON growth_evaluations;
DROP TRIGGER IF EXISTS on_growth_evaluation_insert ON growth_evaluations;

-- 6️⃣ REMOVE SUBMISSIONS TABLE (legacy system)
DROP TABLE IF EXISTS submissions CASCADE;

-- 7️⃣ CLEAN UP ANY REMAINING POLICIES
DROP POLICY IF EXISTS "Campus Leads can manage their own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Campus Leads can manage their own growth_evaluations" ON growth_evaluations;
DROP POLICY IF EXISTS "Admins can view all growth_evaluations" ON growth_evaluations;
DROP POLICY IF EXISTS "Everyone can read core_principles" ON core_principles;

-- 8️⃣ REMOVE INDEXES (if exist)
DROP INDEX IF EXISTS idx_growth_evaluations_user_id;
DROP INDEX IF EXISTS idx_growth_evaluations_principle_id;
DROP INDEX IF EXISTS idx_growth_evaluations_week;
DROP INDEX IF EXISTS idx_core_principles_name;
DROP INDEX IF EXISTS idx_submissions_user_id;
DROP INDEX IF EXISTS idx_submissions_status;

-- Done ✅
-- The system now only uses:
-- - reflections table (for AI-evaluated reflections)
-- - user_gpa table (for calculated GPA from reflections)
-- - reflection_questions table (for predefined questions)
-- - profiles table (without GPA columns)
