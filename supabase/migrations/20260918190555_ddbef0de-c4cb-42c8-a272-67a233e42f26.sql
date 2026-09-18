CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_provider_id_unique
ON public.orders(payment_provider_id)
WHERE payment_provider_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.finalize_pix_generation(
  p_order_id uuid,
  p_qr_code text,
  p_copy_paste text,
  p_provider_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_expires_at timestamptz := now() + interval '180 seconds';
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  IF v_order.pix_generation_status = 'ready' AND v_order.payment_provider_id IS NOT NULL THEN
    IF v_order.payment_provider_id <> p_provider_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Cobrança diferente já vinculada ao pedido');
    END IF;
    RETURN jsonb_build_object('ok', true, 'state', 'ready', 'expires_at', v_order.expires_at);
  END IF;

  IF v_order.pix_generation_status <> 'processing' OR v_order.payment_provider_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Geração PIX não está disponível para finalização');
  END IF;

  UPDATE public.orders
  SET pix_qr_code = p_qr_code,
      pix_copy_paste = p_copy_paste,
      payment_provider_id = p_provider_id,
      payment_provider = 'mercadopago',
      pix_generation_status = 'ready',
      pix_generation_error_code = NULL,
      expires_at = v_expires_at,
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.raffle_numbers
  SET reserved_until = v_expires_at
  WHERE current_order_id = p_order_id AND status = 'reserved';

  RETURN jsonb_build_object('ok', true, 'state', 'ready', 'expires_at', v_expires_at);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('ok', false, 'error', 'Cobrança já vinculada a outro pedido');
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_pix_generation(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_pix_generation(uuid,text,text,text) TO service_role;