-- 1. Garantir que as funções usem tipos compatíveis e permissões corretas
ALTER FUNCTION public.is_admin() SECURITY DEFINER;

-- 2. Políticas de Storage para os buckets de banners
-- (Assumindo que os buckets já existem ou serão usados pelo app)
DO $$
BEGIN
    -- Remover políticas para evitar duplicatas
    DROP POLICY IF EXISTS "Public Read Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Insert Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Banners" ON storage.objects;
END $$;

CREATE POLICY "Public Read Banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('banners', 'banners-reviva'));

CREATE POLICY "Admin Insert Banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('banners', 'banners-reviva') AND public.is_admin());

CREATE POLICY "Admin Update Banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('banners', 'banners-reviva') AND public.is_admin())
WITH CHECK (bucket_id IN ('banners', 'banners-reviva') AND public.is_admin());

CREATE POLICY "Admin Delete Banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('banners', 'banners-reviva') AND public.is_admin());

-- 3. Garantir privilégios básicos para tabelas de storage
GRANT ALL ON storage.objects TO service_role;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
