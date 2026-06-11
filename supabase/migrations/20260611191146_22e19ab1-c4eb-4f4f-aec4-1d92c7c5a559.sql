-- Garante que os buckets existam (caso não existam) e define políticas de visualização pública
DO $$
BEGIN
    -- Política para banners
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access banners'
    ) THEN
        CREATE POLICY "Public Access banners" ON storage.objects FOR SELECT TO public USING (bucket_id = 'banners');
    END IF;

    -- Política para banners-reviva
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access banners-reviva'
    ) THEN
        CREATE POLICY "Public Access banners-reviva" ON storage.objects FOR SELECT TO public USING (bucket_id = 'banners-reviva');
    END IF;
END $$;
