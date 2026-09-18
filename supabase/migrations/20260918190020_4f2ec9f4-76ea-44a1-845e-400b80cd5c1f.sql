GRANT SELECT ON public.payment_reconciliation_issues TO authenticated;
CREATE POLICY "Admins read payment reconciliations"
ON public.payment_reconciliation_issues
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE admin_users.auth_user_id = auth.uid()
));

REVOKE ALL ON FUNCTION public.get_seller_ranking(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_ranking(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;