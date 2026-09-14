CREATE OR REPLACE FUNCTION public.confirm_payment(p_order_id uuid, p_external_id text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_sold_count integer;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Pedido não encontrado');
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN json_build_object('ok', true, 'already_paid', true);
  END IF;

  IF v_order.status NOT IN ('pending', 'cancelled') THEN
    RETURN json_build_object('ok', false, 'error', 'Pedido não pode ser confirmado neste estado');
  END IF;

  SELECT count(*) INTO v_sold_count
  FROM public.raffle_numbers
  WHERE current_order_id = p_order_id
    AND status IN ('reserved', 'sold');

  IF v_sold_count <> v_order.quantity THEN
    RETURN json_build_object('ok', false, 'error', 'Os números deste pedido já foram liberados ou reassociados');
  END IF;

  UPDATE public.orders
  SET status = 'paid',
      paid_at = COALESCE(paid_at, now()),
      payment_provider = 'mercadopago',
      payment_provider_id = COALESCE(p_external_id, payment_provider_id),
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.raffle_numbers
  SET status = 'sold',
      reserved_until = NULL,
      sold_at = COALESCE(sold_at, now())
  WHERE current_order_id = p_order_id
    AND status IN ('reserved', 'sold');

  RETURN json_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_payment(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_payment(uuid, text) TO service_role;