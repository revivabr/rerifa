REVOKE EXECUTE ON FUNCTION public.get_seller_ranking(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_ranking(uuid) TO anon, service_role;

REVOKE EXECUTE ON FUNCTION public.reserve_numbers(uuid,integer[],text,text,text,text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(uuid,integer[],text,text,text,text) TO anon, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;