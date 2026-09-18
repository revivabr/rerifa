CREATE POLICY "Service role manages payment webhook events"
ON public.payment_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages payment reconciliations"
ON public.payment_reconciliation_issues
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

REVOKE ALL ON FUNCTION public.confirm_payment(uuid,text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_payment(uuid,text) TO service_role;