# 🎛️ Admin Score Editing Feature

## Overview

Admins and SuperAdmins can now manually override AI scores and add feedback for campus lead reflections.

---

## Features

### ✅ Manual Score Override
- **Effort Score (0-10)**: Override AI-generated effort score
- **Quality Score (0-10)**: Override AI-generated quality score
- **Admin Feedback**: Add written feedback on the submission

### ✅ Tracking
- `manually_reviewed`: Flag indicating manual review
- `reviewed_by`: User ID of the admin who reviewed
- `reviewed_at`: Timestamp of the review
- Shows previous reviews and their feedback

---

## How to Use

### For Admins:

1. **Navigate to Admin Dashboard** → "Reflection Submissions" tab
2. **Find a submission** you want to review
3. **Click to expand** the submission details
4. **Go to "Admin Review" tab** (4th tab)
5. **Click "Review This Submission"** button
6. **Enter scores and feedback**:
   - Set Effort Score (0-10)
   - Set Quality Score (0-10)
   - Write feedback in the text area
7. **Click "Save Scores"**

### Visual Indicators:

- 🟢 **"Reviewed" badge** - Submission has been manually reviewed
- 📝 **Previous Feedback** - Shows prior admin feedback if exists
- 🎯 **Manual Scores** - Shows admin override scores separately from AI scores

---

## Database Schema

New columns added to `reflections` table:

```sql
admin_effort_score NUMERIC (0-10) - Manual effort score override
admin_quality_score NUMERIC (0-10) - Manual quality score override
admin_feedback TEXT - Admin feedback text
manually_reviewed BOOLEAN - Review flag
reviewed_by UUID - Admin user ID
reviewed_at TIMESTAMP - Review timestamp
```

---

## Permissions

- ✅ **Admins**: Can edit all reflections
- ✅ **SuperAdmins**: Can edit all reflections
- ❌ **Campus Leads**: Cannot edit (read-only)

---

## Security (RLS)

New RLS policy added:
```sql
"Admins can update all reflections"
ON reflections FOR UPDATE
USING (EXISTS (SELECT 1 FROM user_roles 
               WHERE user_id = auth.uid() 
               AND role IN ('admin', 'superadmin')))
```

---

## Status

✅ **Database Migration**: Created
✅ **Admin Interface**: Implemented
✅ **RLS Policies**: Configured
✅ **State Management**: Complete

---

## Next Steps

1. **Deploy the migration** to Supabase:
   ```sql
   -- Run: supabase/migrations/20250128000002_add_admin_feedback.sql
   ```

2. **Test the feature**:
   - Login as admin
   - Navigate to reflection submissions
   - Edit a score and verify it saves

3. **Verify in database**:
   - Check `reflections` table
   - Confirm new columns exist
   - Test RLS policies

---

## Notes

- Admin scores are stored separately from AI scores
- Both scores can coexist
- The UI shows which score is manual vs AI-generated
- All changes are tracked with timestamps and reviewer ID
