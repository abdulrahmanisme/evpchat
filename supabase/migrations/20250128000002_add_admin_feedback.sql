-- Add admin feedback and manual score override fields to reflections table

ALTER TABLE reflections 
ADD COLUMN IF NOT EXISTS admin_effort_score NUMERIC CHECK (admin_effort_score BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS admin_quality_score NUMERIC CHECK (admin_quality_score BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
ADD COLUMN IF NOT EXISTS manually_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policy for admins to update reflections
DROP POLICY IF EXISTS "Admins can update all reflections" ON reflections;

CREATE POLICY "Admins can update all reflections"
ON reflections
FOR UPDATE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

COMMENT ON COLUMN reflections.admin_effort_score IS 'Manual effort score override by admin/superadmin';
COMMENT ON COLUMN reflections.admin_quality_score IS 'Manual quality score override by admin/superadmin';
COMMENT ON COLUMN reflections.admin_feedback IS 'Admin/superadmin feedback on the reflection';
COMMENT ON COLUMN reflections.manually_reviewed IS 'Flag to indicate if this reflection was manually reviewed';
COMMENT ON COLUMN reflections.reviewed_by IS 'User ID of the admin who reviewed this reflection';
COMMENT ON COLUMN reflections.reviewed_at IS 'Timestamp when the reflection was reviewed';