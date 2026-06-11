-- 1. Restringir leitura de orders a admins (buyers leem via server function com service role)
DROP POLICY IF EXISTS "orders public read" ON public.orders;
CREATE POLICY "orders admin read"
ON public.orders FOR SELECT
TO authenticated
USING (is_admin());

-- 2. Restringir leitura de order_numbers a admins
DROP POLICY IF EXISTS "order_numbers public read" ON public.order_numbers;
CREATE POLICY "order_numbers admin read"
ON public.order_numbers FOR SELECT
TO authenticated
USING (is_admin());

-- 3. raffle_numbers: manter leitura pública de number/status, mas revogar colunas sensíveis
REVOKE SELECT ON public.raffle_numbers FROM anon, authenticated;
GRANT SELECT (id, campaign_id, number, status, created_at) ON public.raffle_numbers TO anon, authenticated;
-- admins precisam ler todas as colunas via policy admin (is_admin())
GRANT ALL ON public.raffle_numbers TO service_role;

-- 4. Storage bucket 'banners': restringir writes a admins
DROP POLICY IF EXISTS "Allow authenticated uploads to banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read from banners" ON storage.objects;

CREATE POLICY "Admin write banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners' AND is_admin());

CREATE POLICY "Admin update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners' AND is_admin())
WITH CHECK (bucket_id = 'banners' AND is_admin());

CREATE POLICY "Admin delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners' AND is_admin());
