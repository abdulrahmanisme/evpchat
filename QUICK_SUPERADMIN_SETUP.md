# Quick Superadmin Setup - Single User Creation

## 🚀 **Easy 3-Step Process**

Since you only need **1 superadmin user**, here's the simplest approach:

### **Step 1: Create User Account**
1. Go to `/superadmin-login`
2. Scroll down to "Create Superadmin User" section
3. Fill in:
   - **Email**: `superadmin@evp.com`
   - **Password**: `SuperAdmin123!`
4. Click "Create User Account"
5. **Copy the generated SQL command**

### **Step 2: Run SQL in Supabase**
1. Go to your Supabase Dashboard → SQL Editor
2. **Paste and run this SQL** (replace with your email):
```sql
-- Make the user a superadmin
UPDATE public.user_roles 
SET role = 'superadmin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'superadmin@evp.com'
);

-- If the user doesn't exist in user_roles table yet, use this instead:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users 
WHERE email = 'superadmin@evp.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'superadmin'::app_role;
```

### **Step 3: Login as Superadmin**
1. Go back to `/superadmin-login`
2. Use the credentials you created:
   - **Email**: `superadmin@evp.com`
   - **Password**: `SuperAdmin123!`
3. Click "Access Superadmin Panel"
4. You'll be redirected to `/superadmin` dashboard

## 🔧 **Alternative: Manual SQL Creation**

If you prefer to create everything manually:

### **Step 1: Create User in Supabase Auth**
```sql
-- This creates a user in Supabase Auth
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'superadmin@evp.com',
  crypt('SuperAdmin123!', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

### **Step 2: Create Profile**
```sql
-- Create profile for the user
INSERT INTO public.profiles (
  id,
  name,
  campus_name,
  course,
  batch,
  joined_evp_on
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'superadmin@evp.com'),
  'Super Admin',
  'System',
  'Administration',
  '2024',
  CURRENT_DATE
);
```

### **Step 3: Assign Superadmin Role**
```sql
-- Assign superadmin role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'superadmin@evp.com'),
  'superadmin'
);
```

## ✅ **Verification**

After completing either method, verify your superadmin user:

```sql
-- Check if superadmin role exists
SELECT unnest(enum_range(NULL::app_role));

-- Check your user role
SELECT p.name, ur.role 
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.name = 'Super Admin';
```

## 🎉 **Ready to Use!**

Once you complete the setup:
1. Go to `/superadmin-login`
2. Login with your superadmin credentials
3. Access the full superadmin dashboard at `/superadmin`

You'll have complete control over the entire EVP Campus Champions system!

