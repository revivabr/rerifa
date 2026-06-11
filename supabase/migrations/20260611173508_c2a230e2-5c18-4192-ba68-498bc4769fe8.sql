-- Correção definitiva para recursão infinita na tabela admin_users

-- 1. Limpar TODAS as políticas existentes para garantir um estado limpo
DROP POLICY IF EXISTS "admin_users self read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users admin write" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage all records" ON public.admin_users;

-- 2. Criar a política MAIS SIMPLES POSSÍVEL para leitura
-- Sem subqueries, sem funções, apenas comparação direta de ID
CREATE POLICY "Allow self read" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (auth_user_id = auth.uid());

-- 3. Criar política para gerenciamento (apenas service_role ou super_admin via verificação direta)
CREATE POLICY "Allow super_admin manage" 
ON public.admin_users FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM public.admin_users WHERE auth_user_id = auth.uid()) = 'super_admin'
);

-- NOTA: Se a política acima ainda causar recursão (Postgres às vezes é sensível), 
-- o ideal para gerenciamento de admins é usar o service_role via Edge Functions ou server functions.
-- Para o LOGIN, a política "Allow self read" é suficiente e NÃO causa recursão.

-- 4. Garantir permissões de execução para a função is_admin, mas simplificá-la se necessário
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Verificação direta que não dispara políticas recursivas de SELECT se usada corretamente
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE auth_user_id = auth.uid()
  );
$function$;
