# Supabase Setup Guide for EVP Campus Champions

## ✅ What's Already Done

1. **Environment Variables**: Created `.env` file with your Supabase credentials
2. **Client Configuration**: Updated `src/integrations/supabase/client.ts` to use `VITE_SUPABASE_ANON_KEY`
3. **Project Config**: Updated `supabase/config.toml` with your project ID
4. **Connection Test**: Added a test component to verify the connection

## 🗄️ Database Setup Required

Your Supabase project needs the following database tables and structure. Run this SQL in your Supabase SQL Editor:

### Step 1: Run the Migration SQL

Copy and paste the entire contents of `supabase/migrations/20251023080634_a6a8d034-710b-408a-a26d-cf1a976ae815.sql` into your Supabase SQL Editor and execute it.

This will create:
- **Enums**: `performance_category`, `submission_status`, `app_role`
- **Tables**: `profiles`, `submissions`, `user_roles`
- **Security**: Row Level Security (RLS) policies
- **Storage**: `proofs` bucket for file uploads
- **Functions**: `has_role()` for permission checking
- **Triggers**: Auto-create profiles and assign roles on user signup

### Step 2: Verify Storage Bucket

1. Go to your Supabase Dashboard → Storage
2. Verify the `proofs` bucket exists
3. If not, create it manually with these settings:
   - Name: `proofs`
   - Public: `false`

### Step 3: Test the Connection

1. Start the development server: `npm run dev`
2. Open http://localhost:8080
3. You should see a "Supabase Connection Test" component at the bottom
4. It will show:
   - ✅ Connection Status: Connected
   - ✅ All tables exist (profiles, submissions, user_roles)

## 🔐 Authentication Setup

### Enable Authentication Providers

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable the providers you want to use:
   - **Email**: For email/password signup
   - **Google**: For Google OAuth (optional)
   - **GitHub**: For GitHub OAuth (optional)

### Configure Email Settings (Optional)

1. Go to Authentication → Settings
2. Configure your email templates
3. Set up SMTP if you want custom email sending

## 👤 Admin User Setup

To create an admin user:

1. **Sign up normally** through the app (this creates a campus_lead role)
2. **Run this SQL** in Supabase SQL Editor to promote a user to admin:

```sql
-- Replace 'user-email@example.com' with the actual user email
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'user-email@example.com'
);
```

## 🧪 Testing the Application

### Test User Flow:
1. **Sign Up**: Create a new account
2. **Apply**: Complete the profile form
3. **Dashboard**: Submit performance proofs
4. **Leaderboard**: View rankings
5. **Admin**: Test admin features (if you have admin role)

### Test Admin Features:
1. **Admin Dashboard**: `/admin` route
2. **Review Submissions**: Verify pending submissions
3. **Manage Users**: View all campus leads
4. **Analytics**: Check overview statistics

## 🚀 Deployment

The app is ready for deployment. The `.env` file contains your production Supabase credentials.

### Remove Test Component

After confirming everything works, remove the connection test:

1. Remove the import from `src/pages/Landing.tsx`
2. Remove the `<SupabaseConnectionTest />` component
3. Delete `src/components/SupabaseConnectionTest.tsx`

## 🔧 Troubleshooting

### Common Issues:

1. **"relation does not exist"**: Run the migration SQL
2. **"permission denied"**: Check RLS policies are applied
3. **"bucket not found"**: Create the `proofs` storage bucket
4. **"invalid JWT"**: Verify your anon key is correct

### Check Connection:
- Visit the landing page to see the connection test
- Check browser console for any errors
- Verify environment variables are loaded

## 📱 Features Overview

Once set up, your app will have:

- **User Registration/Login**
- **Profile Management** (campus, course, batch info)
- **Performance Tracking** (6 categories with scoring)
- **File Upload** (proof documents)
- **Admin Verification** (approve/reject submissions)
- **Leaderboard** (rankings and competition)
- **Role-based Access** (admin vs campus lead)

The application is now ready to use! 🎉
