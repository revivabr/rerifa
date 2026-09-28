DROP POLICY IF EXISTS "raffle public read" ON public.raffle_numbers;
REVOKE SELECT ON public.raffle_numbers FROM anon;
CREATE POLICY "raffle admin read"
ON public.raffle_numbers
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Public Access Banners-Reviva" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read Banners" ON storage.objects;
CREATE POLICY "Admins read campaign images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('banners', 'banners-reviva')
  AND public.is_admin()
);