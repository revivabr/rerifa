ALTER FUNCTION public.reserve_numbers(uuid,integer[],text,text,text,text) SECURITY INVOKER;
ALTER FUNCTION public.is_admin() SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER FUNCTION public.get_seller_ranking(uuid) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.get_seller_ranking(uuid) TO anon, authenticated, service_role;