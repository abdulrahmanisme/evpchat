-- Step 2: Add superadmin RLS policies (run this AFTER the enum is committed)
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
