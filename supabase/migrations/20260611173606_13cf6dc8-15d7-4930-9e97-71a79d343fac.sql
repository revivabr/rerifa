-- Solução DEFINITIVA para recursão infinita em admin_users

-- 1. Limpar TODAS as políticas da tabela admin_users
DROP POLICY IF EXISTS "admin_users self read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users admin write" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage all records" ON public.admin_users;
DROP POLICY IF EXISTS "Allow self read" ON public.admin_users;
DROP POLICY IF EXISTS "Allow super_admin manage" ON public.admin_users;

-- 2. Ativar RLS (caso não esteja)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Criar uma política de leitura BASEADA EM ID (sem subqueries ou funções)
-- Isso permite que o usuário autenticado leia SEU PRÓPRIO registro.
-- É o suficiente para o login e useAdminSession funcionarem.
CREATE POLICY "admin_users_read_self" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (auth_user_id = auth.uid());

-- 4. Criar política para super_admin BASEADA EM METADADOS (opcional, para evitar recursão)
-- Ou simplesmente permitir que o service_role gerencie via dashboard (que usa server functions).
-- Se precisar gerenciar via Dashboard (lado do cliente), usamos uma política que não faz SELECT na mesma tabela.
CREATE POLICY "admin_users_manage_all" 
ON public.admin_users FOR ALL 
TO authenticated 
USING (
  -- Usamos o ID do admin fixo ou uma verificação que não cause loop
  -- Para segurança total e simplicidade, vamos permitir apenas leitura por enquanto.
  -- Gerenciamento deve ser feito via service_role no backend.
  false 
);

-- 5. Simplificar a função is_admin() para não ser usada em políticas recursivas
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Verificação direta que não causa loop se usada no código, não em políticas
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE auth_user_id = auth.uid()
  );
$function$;
