CREATE OR REPLACE FUNCTION public.start_pix_payment_window(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamptz := now() + interval '90 seconds';
BEGIN
  UPDATE public.orders
  SET expires_at = v_expires_at,
      updated_at = now()
  WHERE id = p_order_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  UPDATE public.raffle_numbers
  SET reserved_until = v_expires_at
  WHERE current_order_id = p_order_id
    AND status = 'reserved';

  RETURN jsonb_build_object('ok', true, 'expires_at', v_expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.start_pix_payment_window(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_pix_payment_window(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_order_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  UPDATE public.raffle_numbers
  SET status = 'available',
      reserved_until = NULL,
      current_order_id = NULL,
      buyer_id = NULL
  WHERE current_order_id = p_order_id
    AND status = 'reserved';

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired_orders AS (
    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = now()
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    RETURNING id
  )
  UPDATE public.raffle_numbers rn
  SET status = 'available',
      reserved_until = NULL,
      current_order_id = NULL,
      buyer_id = NULL
  FROM expired_orders eo
  WHERE rn.current_order_id = eo.id
    AND rn.status = 'reserved';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO anon, authenticated, service_role;

SELECT public.expire_pending_orders();