# How to Create and Login as Superadmin

## 🚀 **Step-by-Step Guide to Create Superadmin**

### **Method 1: Create Superadmin User Directly (Recommended)**

1. **Go to the Superadmin Login Page**
   - Navigate to `/superadmin-login` in your browser
   - Or click "Superadmin Login" on the landing page

2. **Use the Admin User Creator**
   - Scroll down to the "Create Admin User" section
   - Fill in the form:
     - **Email**: `superadmin@example.com` (or your preferred email)
     - **Password**: Choose a strong password (minimum 6 characters)
     - **Name**: `Super Admin`
     - **Campus**: `System`
     - **Course**: `Administration`
     - **Batch**: `2024`
     - **Role**: Select `Superadmin`

3. **Click "Create User Account"**
   - This will create the user account
   - Copy the generated SQL command

4. **Run the SQL Command**
   - Go to your Supabase Dashboard → SQL Editor
   - Paste and run the copied SQL command
   - This will assign the superadmin role

5. **Login as Superadmin**
   - Go back to `/superadmin-login`
   - Use the email and password you just created
   - Click "Access Superadmin Panel"

### **Method 2: Create Regular User First, Then Promote**

1. **Create a Regular User**
   - Go to `/auth` and sign up with your email and password
   - Complete the profile setup at `/apply`

2. **Promote to Superadmin**
   - Run this SQL in Supabase SQL Editor:
   ```sql
   UPDATE public.user_roles 
   SET role = 'superadmin' 
   WHERE user_id = (
     SELECT id FROM auth.users 
     WHERE email = 'your-email@example.com'
   );
   ```

3. **Login as Superadmin**
   - Go to `/superadmin-login`
   - Use your regular login credentials
   - You'll now have superadmin access

### **Method 3: Manual SQL Creation (Advanced)**

If you prefer to create everything manually via SQL:

1. **Create User Account**
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
     'superadmin@example.com',
     crypt('your-password', gen_salt('bf')),
     now(),
     now(),
     now()
   );
   ```

2. **Create Profile**
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
     (SELECT id FROM auth.users WHERE email = 'superadmin@example.com'),
     'Super Admin',
     'System',
     'Administration',
     '2024',
     CURRENT_DATE
   );
   ```

3. **Assign Superadmin Role**
   ```sql
   -- Assign superadmin role
   INSERT INTO public.user_roles (user_id, role)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'superadmin@example.com'),
     'superadmin'
   );
   ```

## 🔐 **Recommended Credentials**

For testing purposes, you can use:
- **Email**: `superadmin@evp.com`
- **Password**: `SuperAdmin123!`
- **Name**: `Super Admin`
- **Campus**: `System`
- **Course**: `Administration`
- **Batch**: `2024`

## ✅ **Verification Steps**

After creating your superadmin user:

1. **Check if superadmin role exists**:
   ```sql
   SELECT unnest(enum_range(NULL::app_role));
   ```
   Should show: `campus_lead`, `admin`, `superadmin`

2. **Check your user role**:
   ```sql
   SELECT p.name, ur.role 
   FROM public.profiles p
   JOIN public.user_roles ur ON p.id = ur.user_id
   WHERE p.name = 'Super Admin';
   ```
   Should show: `Super Admin | superadmin`

3. **Test Login**:
   - Go to `/superadmin-login`
   - Enter your credentials
   - You should be redirected to `/superadmin` dashboard

## 🚨 **Troubleshooting**

### **If Login Fails:**
1. **Check email**: Make sure the email exists in `auth.users`
2. **Check password**: Ensure password is correct
3. **Check role**: Verify the user has `superadmin` role
4. **Check policies**: Make sure superadmin policies are applied

### **If Access Denied:**
1. **Verify role assignment**:
   ```sql
   SELECT ur.role FROM public.user_roles ur
   JOIN auth.users au ON ur.user_id = au.id
   WHERE au.email = 'your-email@example.com';
   ```

2. **Check RLS policies**: Make sure superadmin policies are created

### **If User Creation Fails:**
1. **Check if email already exists**:
   ```sql
   SELECT email FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. **Use a different email** if the current one exists

## 🎉 **Success!**

Once you can login as superadmin, you'll have access to:
- **Complete system overview** with analytics
- **User management** for all campus leads
- **Admin management** for all admin users
- **Submission oversight** for all submissions
- **System administration** with bulk operations
- **Data export** and system controls

The superadmin dashboard gives you complete control over the entire EVP Campus Champions platform!
