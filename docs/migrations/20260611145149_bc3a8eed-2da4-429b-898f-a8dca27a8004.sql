-- 1. Permitir acesso público para leitura no bucket 'banners-reviva'
CREATE POLICY "Public Read Banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners-reviva');

-- 2. Permitir que administradores façam upload e gerenciem arquivos
CREATE POLICY "Admin Manage Banners"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'banners-reviva' AND 
  (SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid()))
)
WITH CHECK (
  bucket_id = 'banners-reviva' AND 
  (SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid()))
);
