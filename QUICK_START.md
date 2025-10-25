# 🚀 Quick Start: Deploy Your Edge Function & SQL Migration

## What You Need to Do

You have 2 things to deploy manually since CLI isn't working:

1. **SQL Migration** - Update database with new columns
2. **Edge Function** - Deploy the AI evaluation function

---

## Step 1: Deploy SQL Migration ✅

### Go to Supabase SQL Editor

1. Open: https://supabase.com/dashboard/project/mxfjaawvdwcmvogimzxq/sql/new
2. Copy ALL the code from: `supabase/migrations/20250128000001_update_evaluation_metrics.sql`
3. Paste it into the SQL Editor
4. Click **Run**
5. Wait for success message ✅

---

## Step 2: Deploy Edge Function ✅

### Check if function exists

1. Go to: https://supabase.com/dashboard/project/mxfjaawvdwcmvogimzxq/functions
2. Look for `evaluate-reflection`

### If function DOESN'T exist:

1. Click **Create a new function**
2. Name it: `evaluate-reflection`
3. Copy ALL code from: `supabase/functions/evaluate-reflection/index.ts`
4. Paste into the editor
5. Click **Deploy**

### If function DOES exist:

1. Click on `evaluate-reflection`
2. Click **Edit** (pencil icon)
3. Replace ALL code with code from: `supabase/functions/evaluate-reflection/index.ts`
4. Click **Deploy**

---

## Step 3: Add Gemini API Key 🔑

1. Still in the `evaluate-reflection` function page
2. Click **Settings** tab (top right)
3. Scroll down to **Secrets**
4. Click **Add secret**
5. Name: `GEMINI_API_KEY`
6. Value: Your Gemini API key (get it from: https://makersuite.google.com/app/apikey)
7. Click **Save**
8. Redeploy the function

---

## Step 4: Test It! 🧪

### Option A: Test via Dashboard

1. Go to your app
2. Submit a reflection
3. Check if scores are saved in database

### Option B: Test with SQL

Go to SQL Editor and run:

```sql
SELECT 
  id,
  principle,
  effort_score,
  quality_score,
  depth_score,
  scale_score,
  created_at
FROM reflections
ORDER BY created_at DESC
LIMIT 5;
```

If you see scores in `depth_score` and `scale_score` → **SUCCESS! ✅**

---

## ✅ Done!

Your new evaluation system is now deployed!

**What changed:**
- ✅ Added 4-metric system (Effort, Quality, Depth, Scale)
- ✅ Added credit-weighted GPA calculation
- ✅ Updated database columns
- ✅ AI evaluation now scores all 4 metrics

---

## 🆘 Need Help?

**Problem: SQL migration fails**
- Make sure you copied the ENTIRE file
- Check for syntax errors in the error message

**Problem: Edge Function not found**
- Make sure you created it with exact name: `evaluate-reflection`

**Problem: Scores not saving**
- Check Edge Function logs for errors
- Verify GEMINI_API_KEY is set correctly

**Problem: Still seeing old 2-metric system**
- Clear your browser cache
- Check that SQL migration actually ran
