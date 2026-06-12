-- 1. Ensure the buckets exist (they do, but let's be safe)
-- 2. Enable public access on the buckets via RLS policies (since direct 'public' flag update is restricted)

-- Create a policy to allow public read access to 'banners-reviva'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Public Access to Banners-Reviva' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access to Banners-Reviva" ON storage.objects
        FOR SELECT TO public USING (bucket_id = 'banners-reviva');
    END IF;
END
$$;

-- Create a policy to allow public read access to 'banners'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Public Access to Banners' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access to Banners" ON storage.objects
        FOR SELECT TO public USING (bucket_id = 'banners');
    END IF;
END
$$;

-- 3. Ensure we are using the correct project URL in the database
UPDATE campaigns 
SET banner_url = 'https://auglpyxijmffkfejdcji.supabase.co/storage/v1/object/public/banners-reviva/' || 
    substring(banner_url from 'campaigns/.*$')
WHERE banner_url LIKE '%supabase.co%';
