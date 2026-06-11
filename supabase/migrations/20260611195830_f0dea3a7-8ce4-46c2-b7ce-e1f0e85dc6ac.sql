-- Define políticas de visualização pública para os objetos nos buckets 'banners' e 'banners-reviva'
-- Essas políticas permitem que qualquer pessoa veja os arquivos, mesmo que o bucket em si seja privado.

DO $$
BEGIN
    -- Política para o bucket 'banners'
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access banners'
    ) THEN
        CREATE POLICY "Public Access banners" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'banners');
    END IF;

    -- Política para o bucket 'banners-reviva'
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access banners-reviva'
    ) THEN
        CREATE POLICY "Public Access banners-reviva" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'banners-reviva');
    END IF;
END $$;
