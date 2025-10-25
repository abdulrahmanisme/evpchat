# Fixed SQL Migration - Run These Steps Separately

## The Problem
PostgreSQL requires enum values to be committed before they can be used in policies. The error occurs because we're trying to use the new `superadmin` enum value in the same transaction.

## Solution: Run These SQL Commands Separately

### Step 1: Add the Superadmin Enum Value
Copy and paste this into your Supabase SQL Editor and run it:

```sql
ALTER TYPE app_role ADD VALUE 'superadmin';
```

**Wait for this to complete successfully before proceeding to Step 2.**

### Step 2: Add Superadmin Policies
After Step 1 is complete, copy and paste this into your Supabase SQL Editor and run it:

```sql
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can view all submissions"
  ON public.submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update all submissions"
  ON public.submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can view all proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proofs' AND
    public.has_role(auth.uid(), 'superadmin')
  );
```

### Step 3: Create Your First Superadmin User
After both steps above are complete, create a superadmin user:

1. **First, create a regular admin user** (if you don't have one):
   - Go to `/admin-login` and create an admin user
   - Or use the admin user creator on that page

2. **Then promote them to superadmin** by running this SQL:
```sql
UPDATE public.user_roles 
SET role = 'superadmin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-admin-email@example.com'
);
```

Replace `your-admin-email@example.com` with the actual email of your admin user.

## Why This Happens
PostgreSQL enums are special data types that require explicit commits. When you add a new enum value, it must be committed to the database before it can be referenced in other statements like policies.

## Verification
After completing all steps, you can verify the superadmin role exists by running:
```sql
SELECT unnest(enum_range(NULL::app_role));
```

This should show: `campus_lead`, `admin`, `superadmin`

## Ready to Use!
Once all steps are complete, you can:
1. Go to `/superadmin-login`
2. Login with your superadmin credentials
3. Access the full superadmin dashboard at `/superadmin`
