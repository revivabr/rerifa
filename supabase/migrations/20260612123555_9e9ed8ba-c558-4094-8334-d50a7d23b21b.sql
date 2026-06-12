-- Update banner URLs to use the current project URL if they contain the old one
-- We use a generic replacement to ensure consistency
UPDATE campaigns 
SET banner_url = 'https://auglpyxijmffkfejdcji.supabase.co/storage/v1/object/public/banners-reviva/' || 
    substring(banner_url from 'campaigns/.*$')
WHERE banner_url LIKE '%supabase.co%';

-- Ensure public access policies are robust for both buckets
DO $$
BEGIN
    -- Public Read for banners-reviva
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Public Access banners-reviva' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access banners-reviva" ON storage.objects
        FOR SELECT TO public USING (bucket_id = 'banners-reviva');
    END IF;

    -- Public Read for banners
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Public Access banners' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access banners" ON storage.objects
        FOR SELECT TO public USING (bucket_id = 'banners');
    END IF;
END
$$;
