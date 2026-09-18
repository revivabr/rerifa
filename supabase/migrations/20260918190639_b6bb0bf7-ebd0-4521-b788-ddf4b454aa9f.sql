CREATE OR REPLACE FUNCTION public.mark_reconciliation_result(
  p_provider_payment_id text,
  p_status text,
  p_refund_provider_id text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order_id uuid;
BEGIN
  IF p_status NOT IN ('refund_processing','refunded','manual_review','refund_failed') THEN
    RAISE EXCEPTION 'Situação de reconciliação inválida';
  END IF;
  UPDATE public.payment_reconciliation_issues
  SET status = CASE WHEN status = 'refunded' THEN 'refunded' ELSE p_status END,
      refund_provider_id = coalesce(p_refund_provider_id, refund_provider_id),
      attempt_count = CASE WHEN status = 'refunded' THEN attempt_count ELSE attempt_count + 1 END,
      last_error = CASE WHEN status = 'refunded' THEN last_error ELSE left(p_error, 500) END,
      updated_at = now(),
      resolved_at = CASE WHEN status = 'refunded' OR p_status = 'refunded' THEN coalesce(resolved_at, now()) ELSE resolved_at END
  WHERE provider_payment_id = p_provider_payment_id
  RETURNING order_id INTO v_order_id;
  IF p_status = 'refunded' AND v_order_id IS NOT NULL THEN
    UPDATE public.orders SET status = 'refunded', updated_at = now() WHERE id = v_order_id AND status <> 'paid';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_reconciliation_result(text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_reconciliation_result(text,text,text,text) TO service_role;