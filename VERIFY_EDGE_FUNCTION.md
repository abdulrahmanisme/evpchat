# How to Check if the Edge Function is Deployed Correctly

## 🎯 Quick Summary
This guide shows you **3 ways** to verify the `evaluate-reflection` Edge Function is working.

---

## Method 1: Using the Test Script (Easiest) ✅

### Step 1: Get your Supabase credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mxfjaawvdwcmvogimzxq`
3. Click **Settings** → **API**
4. Copy these values:
   - **Project URL**: `https://mxfjaawvdwcmvogimzxq.supabase.co`
   - **anon/public key**: `eyJhbGc...` (starts with `eyJ`)

### Step 2: Set environment variables
Run these commands in your terminal (from the project root):

```bash
# Set the Supabase URL
export VITE_SUPABASE_URL=https://mxfjaawvdwcmvogimzxq.supabase.co

# Set the anon key (replace with your actual key)
export VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Step 3: Run the test script
```bash
node test-edge-function.js
```

### Step 4: Check the results
**✅ SUCCESS looks like:**
```
✅ SUCCESS: Edge Function is working!
📊 Evaluation Summary:
   Effort Score: 8/10
   Quality Score: 9/10
   Depth Score: 7/10
   Scale Score: 8/10
```

**❌ FAILED looks like:**
```
❌ Error: Request failed with status 404
```
(This means the Edge Function is not deployed)

---

## Method 2: Using cURL (Command Line) 🔧

### Step 1: Get your Supabase anon key
(From Method 1, Step 1)

### Step 2: Run this command
Replace `YOUR_ANON_KEY` with your actual anon key:

```bash
curl -X POST \
  https://mxfjaawvdwcmvogimzxq.supabase.co/functions/v1/evaluate-reflection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "reflection_id": "test-123",
    "principle": "Collaboration",
    "question": "Describe a successful team project",
    "response": "I worked with a team to organize an event.",
    "user_id": "test-user",
    "detailed": false
  }'
```

### Step 3: Check the response
**✅ Good response:**
```json
{
  "success": true,
  "evaluation": {
    "effort_score": 8,
    "quality_score": 9,
    "depth_score": 7,
    "scale_score": 8,
    "feedback": "...",
    "suggestions": ["..."]
  }
}
```

**❌ Bad response:**
```json
{
  "error": "Function not found"
}
```

---

## Method 3: Check in Supabase Dashboard 🖥️

### Step 1: Log into Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project

### Step 2: Check Edge Functions
1. Click **Edge Functions** in the left sidebar
2. Look for `evaluate-reflection` in the list
3. Click on it to see details

### Step 3: Check Function Logs
1. In the `evaluate-reflection` function page, click **Logs**
2. Look for recent invocations
3. Check if there are any errors

### Step 4: Check Environment Variables
1. In the function settings, go to **Secrets**
2. Verify that `GEMINI_API_KEY` is set (it should show `*` to hide the value)

---

## 🔍 Troubleshooting Common Issues

### Issue 1: "Function not found" (404 error)
**Problem:** Edge Function is not deployed

**Solution:**
1. Go to Supabase Dashboard → Edge Functions
2. Click **Create a new function**
3. Name it: `evaluate-reflection`
4. Paste the code from `supabase/functions/evaluate-reflection/index.ts`
5. Click **Deploy**

### Issue 2: "Missing required fields" (400 error)
**Problem:** Request body is missing data

**Solution:**
Make sure your request includes all these fields:
- `reflection_id`
- `principle`
- `question`
- `response`
- `user_id`
- `detailed`

### Issue 3: "AI service not configured" (500 error)
**Problem:** GEMINI_API_KEY is not set

**Solution:**
1. Go to Supabase Dashboard → Edge Functions → Settings
2. Click **Secrets**
3. Add a new secret:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key (get it from [here](https://makersuite.google.com/app/apikey))
4. Redeploy the function

### Issue 4: "Gemini API error"
**Problem:** Invalid API key or quota exceeded

**Solution:**
1. Check your Gemini API key is valid
2. Check your API quota at [Google AI Studio](https://makersuite.google.com/)
3. Make sure you're using `gemini-2.5-flash` model (not older models)

---

## 🧪 Test with Real Data from Your App

Once the Edge Function works with the test script, try it from your actual app:

1. **Submit a reflection** from your Dashboard (as a Campus Lead)
2. **Check the database** to see if scores are saved:
   ```sql
   SELECT 
     id,
     principle,
     question,
     effort_score,
     quality_score,
     depth_score,
     scale_score,
     created_at
   FROM reflections
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Verify the scores** - all 4 metrics should be filled in

---

## 📊 Expected Behavior

When the Edge Function is working correctly:

1. ✅ Campus Lead submits a reflection
2. ✅ The function receives the data
3. ✅ It calls Gemini AI to evaluate the response
4. ✅ It returns scores for all 4 metrics (Effort, Quality, Depth, Scale)
5. ✅ The scores are saved in the `reflections` table
6. ✅ The GPA is automatically recalculated

---

## 🆘 Still Having Issues?

If none of these methods work, check:

1. **Supabase logs**: Dashboard → Logs → Edge Functions
2. **Gemini API status**: [Status Page](https://status.cloud.google.com/)
3. **Network connectivity**: Make sure you can reach Supabase and Google APIs

For more help, check the logs in the Supabase Dashboard or ask for assistance with the specific error message.
