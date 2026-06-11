-- Restringir execução de funções SECURITY DEFINER críticas
REVOKE ALL ON FUNCTION public.seed_raffle_numbers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_raffle_numbers() FROM anon;
REVOKE ALL ON FUNCTION public.seed_raffle_numbers() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.seed_raffle_numbers() TO service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
