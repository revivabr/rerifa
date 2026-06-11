-- Grant permissions to reserve_numbers function
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO service_role;

-- Storage policies for banners-reviva
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access Banners-Reviva'
    ) THEN
        CREATE POLICY "Public Access Banners-Reviva" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'banners-reviva');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Admin Upload Banners-Reviva'
    ) THEN
        CREATE POLICY "Admin Upload Banners-Reviva" ON storage.objects
        FOR ALL TO authenticated
        USING (bucket_id = 'banners-reviva')
        WITH CHECK (bucket_id = 'banners-reviva');
    END IF;
END $$;
