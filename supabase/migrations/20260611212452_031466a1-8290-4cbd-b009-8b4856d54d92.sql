-- Drop existing restrictive policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Banners" ON storage.objects;

-- Create comprehensive public access policy for the banners-reviva bucket
CREATE POLICY "Public Access to Banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners-reviva');

-- Also ensure public access to campaign-assets if it exists
CREATE POLICY "Public Access to Campaign Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-assets');
