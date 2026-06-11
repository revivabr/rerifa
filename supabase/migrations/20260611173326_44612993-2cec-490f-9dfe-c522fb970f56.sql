-- Restaurar permissão de execução para a função is_admin()
-- Esta função é usada pelo cliente para verificar se o usuário logado tem permissões de admin.
-- O erro 403 "permission denied for function is_admin" ocorria porque revogamos o acesso PUBLIC anteriormente.

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
