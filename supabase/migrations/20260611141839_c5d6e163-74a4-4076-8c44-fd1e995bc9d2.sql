-- Allow authenticated users to upload images to banners bucket
CREATE POLICY "Allow authenticated uploads to banners" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners');

-- Allow authenticated users to read from banners bucket
CREATE POLICY "Allow authenticated read from banners" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'banners');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Allow authenticated update banners" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'banners')
  WITH CHECK (bucket_id = 'banners');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated delete banners" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'banners');

-- Allow anon users to read from banners (for viewing campaigns)
CREATE POLICY "Allow anon read from banners" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'banners');