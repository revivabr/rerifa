-- Correção de segurança final para publicação
-- Revogar acesso público e conceder apenas ao service_role para as funções SECURITY DEFINER

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

REVOKE ALL ON FUNCTION public.seed_raffle_numbers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_raffle_numbers() FROM anon;
REVOKE ALL ON FUNCTION public.seed_raffle_numbers() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.seed_raffle_numbers() TO service_role;

-- Nota: Como o app usa is_admin() no lado do cliente, mas agora está restrito ao service_role,
-- o hook useAdminSession.ts e o dashboard funcionarão pois eles consultam a tabela admin_users diretamente,
-- que possui políticas de RLS adequadas e não recursivas.
