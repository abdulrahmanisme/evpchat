# 🔧 AI Evaluation Debugging Guide

## 🐛 **Issue: "AI evaluation temporarily unavailable"**

The AI evaluation is showing fallback messages instead of actual AI analysis. Let me help you debug and fix this issue.

---

## 🔍 **Debugging Steps**

### **1. Check Edge Function Logs**

**Go to Supabase Dashboard:**
- **URL:** https://supabase.com/dashboard/project/mxfjaawvdwcmvogimzxq/functions
- **Click:** `evaluate-reflection` function
- **Go to:** "Logs" tab
- **Look for:** Error messages or API response issues

### **2. Test Edge Function Directly**

**Test the function with a simple request:**

```javascript
// Open browser console and run:
fetch('https://mxfjaawvdwcmvogimzxq.supabase.co/functions/v1/evaluate-reflection', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    reflection_id: 'test-123',
    principle: 'Ownership',
    question: 'What did you take ownership of this week?',
    response: 'I organized our team meeting and ensured everyone had clear action items.',
    user_id: 'test-user-123',
    detailed: true
  })
})
.then(response => response.json())
.then(data => console.log('Result:', data))
.catch(error => console.error('Error:', error));
```

### **3. Check Gemini API Key**

**Verify the API key is set:**
```bash
npx supabase secrets list
```

**Should show:** `GEMINI_API_KEY` with a hash value

### **4. Test Gemini API Directly**

**Test Gemini API with curl:**
```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Respond with a JSON object: {\"effort_score\": 8, \"quality_score\": 7, \"feedback\": \"Great work!\", \"suggestions\": [\"Keep it up!\"]}"
      }]
    }]
  }'
```

---

## 🚀 **Recent Improvements Made**

### **1. Enhanced Error Logging**
- **Added detailed error messages** in Edge Function
- **Added request/response logging** for debugging
- **Added validation** for Gemini API response structure

### **2. Better Frontend Error Handling**
- **Show specific error messages** instead of generic fallback
- **Display actual error details** in the UI
- **Improved debugging** with console logs

### **3. Robust API Response Handling**
- **Validate Gemini response structure** before parsing
- **Handle JSON parsing errors** gracefully
- **Validate required fields** in AI response

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: Gemini API Key Not Set**
**Error:** `Gemini API key not found`
**Solution:** 
```bash
npx supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
npx supabase functions deploy evaluate-reflection
```

### **Issue 2: Invalid Gemini API Response**
**Error:** `Invalid Gemini API response structure`
**Solution:** 
- Check Gemini API quota and billing
- Verify API key is valid and active
- Check if Gemini API is accessible from your region

### **Issue 3: JSON Parsing Error**
**Error:** `Failed to parse AI response`
**Solution:**
- Gemini might be returning non-JSON response
- Check logs for actual response content
- Improve prompt to ensure JSON output

### **Issue 4: CORS Issues**
**Error:** CORS errors in browser
**Solution:**
- Edge Function has CORS headers configured
- Check if function is deployed correctly

---

## 📊 **How to Test**

### **1. Submit a Reflection**
1. **Go to:** `http://localhost:8080/dashboard`
2. **Click:** "Structured Reflections"
3. **Fill out** a reflection form
4. **Submit** and check console for errors

### **2. Check Admin Dashboard**
1. **Go to:** `http://localhost:8080/admin` → "Reflection Submissions"
2. **Click** on a submission to expand
3. **Go to** "Detailed Reasoning" tab
4. **Check** if AI evaluation loads or shows error

### **3. Monitor Logs**
1. **Check browser console** for frontend errors
2. **Check Supabase function logs** for backend errors
3. **Look for specific error messages** instead of generic fallbacks

---

## 🎯 **Expected Behavior**

### **When Working Correctly:**
- **AI evaluation loads** with actual scores and reasoning
- **Detailed reasoning shows** specific analysis
- **No fallback messages** about "temporarily unavailable"

### **When There's an Issue:**
- **Specific error message** shows the actual problem
- **Console logs** show detailed debugging info
- **Fallback evaluation** still provides basic scores

---

## 🚨 **Next Steps**

1. **Check Supabase function logs** for specific error messages
2. **Test the Edge Function directly** with the provided test code
3. **Verify Gemini API key** is set and valid
4. **Check Gemini API quota** and billing status
5. **Look for specific error messages** in the UI instead of generic fallbacks

**The improved error handling should now show you exactly what's going wrong!** 🔍✨

---

## 📞 **If Still Not Working**

**Share the specific error message** you see in:
1. **Browser console** (F12 → Console)
2. **Supabase function logs** (Dashboard → Functions → Logs)
3. **Admin dashboard** (when clicking "Detailed Reasoning")

**This will help identify the exact issue!** 🎯
