-- Resolver o problema de recursão e permissão na tabela admin_users

-- 1. Remover políticas atuais que usam is_admin() e causam recursão
DROP POLICY IF EXISTS "admin_users self read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users admin write" ON public.admin_users;

-- 2. Criar políticas simples e seguras
-- Permite que qualquer usuário autenticado tente ler seu próprio registro (necessário para o login)
CREATE POLICY "Users can read their own admin record" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (auth_user_id = auth.uid());

-- Permite que super_admins gerenciem outros admins (sem usar a função is_admin() para evitar recursão)
CREATE POLICY "Super admins can manage all records" 
ON public.admin_users FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
);

-- 3. Garantir GRANTs básicos para a tabela
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
