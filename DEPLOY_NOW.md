# 🚀 Deploy Your AI Evaluation Metric Function - RIGHT NOW!

## You need to do this MANUALLY via Supabase Dashboard

I cannot deploy for you from the terminal, but I'll guide you step-by-step:

---

## Step 1: SQL Migration (Do This FIRST!) ✅

### A. Open SQL Editor
Open this URL in your browser:
```
https://supabase.com/dashboard/project/mxfjaawvdwcmvogimzxq/sql/new
```

### B. Copy the SQL Code
1. Open this file in your project: `supabase/migrations/20250128000001_update_evaluation_metrics.sql`
2. Select ALL the code (Ctrl+A)
3. Copy it (Ctrl+C)

### C. Paste and Run
1. In the SQL Editor, paste the code
2. Click **Run** button (top right)
3. Wait for success message ✅

**Time needed:** 1 minute

---

## Step 2: Deploy Edge Function ✅

### A. Go to Functions
The browser should have opened:
```
https://supabase.com/dashboard/project/mxfjaawvdwcmvogimzxq/functions
```

If not, open it manually.

### B. Find or Create `evaluate-reflection`

**IF YOU SEE `evaluate-reflection` in the list:**
1. Click on it
2. Click the **Edit** button (pencil icon)
3. Delete ALL existing code
4. Go to step C

**IF YOU DON'T SEE `evaluate-reflection`:**
1. Click **Create a new function** button
2. Name it exactly: `evaluate-reflection`
3. Click **Create function**

### C. Paste the Code
1. Open this file: `supabase/functions/evaluate-reflection/index.ts`
2. Select ALL the code (Ctrl+A)
3. Copy it (Ctrl+C)
4. Paste it into the editor in the browser
5. Click **Deploy** button

**Time needed:** 2 minutes

---

## Step 3: Add Gemini API Key 🔑

### A. Go to Settings
1. Still on the `evaluate-reflection` function page
2. Click **Settings** tab (at the top)
3. Scroll down to **Secrets** section

### B. Add Secret
1. Click **Add secret** button
2. In the popup:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Paste your Gemini API key (get it from: https://makersuite.google.com/app/apikey)
3. Click **Save**

### C. Redeploy
After saving the secret, redeploy the function by clicking **Deploy** again

**Time needed:** 2 minutes

---

## Step 4: Test It! 🧪

Run this command to test:

```powershell
$env:SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZmphYXd2ZHdjbXZvZ2ltenhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTUyNDMsImV4cCI6MjA3Njc5MTI0M30.V9sGCgJON3TjXUt1FOUVMmVX1bbbY_Zm-hhMh8MM-0E"; node test-edge-function-simple.js
```

**Expected result:** ✅ SUCCESS message with all 4 scores!

---

## Total Time Needed: 5 minutes ⏱️

---

## 🆘 Having Issues?

**Problem:** "Function not found" when testing
- **Solution:** Make sure you deployed the function in Step 2

**Problem:** "AI service not configured"
- **Solution:** Add the GEMINI_API_KEY secret in Step 3

**Problem:** "Failed to update reflection"
- **Solution:** Run the SQL migration in Step 1 first!

**Problem:** Can't find the files
- **Solution:** They're in your project folder:
  - SQL: `supabase/migrations/20250128000001_update_evaluation_metrics.sql`
  - Function: `supabase/functions/evaluate-reflection/index.ts`

---

## 📞 Need Help?

If you get stuck at any step, tell me which step and what error you see!
