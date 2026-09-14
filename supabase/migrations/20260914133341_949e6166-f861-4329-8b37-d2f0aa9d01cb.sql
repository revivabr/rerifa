REVOKE EXECUTE ON FUNCTION public.reserve_numbers(uuid, integer[], text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(uuid, integer[], text, text, text, text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_numbers(uuid, integer[], text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_seller_ranking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_seller_ranking(uuid) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;