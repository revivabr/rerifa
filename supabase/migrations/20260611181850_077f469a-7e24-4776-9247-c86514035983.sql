-- Ensure public read access is enabled for the relevant buckets
-- We use a more direct policy since the previous one might have had naming conflicts or was not applied correctly
DROP POLICY IF EXISTS "Public Read Banners" ON storage.objects;
CREATE POLICY "Public Read Banners" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('banners', 'banners-reviva'));

-- Also ensure the admin has full access to 'banners-reviva'
DROP POLICY IF EXISTS "Admin Manage Banners-Reviva" ON storage.objects;
CREATE POLICY "Admin Manage Banners-Reviva" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'banners-reviva' AND is_admin())
WITH CHECK (bucket_id = 'banners-reviva' AND is_admin());