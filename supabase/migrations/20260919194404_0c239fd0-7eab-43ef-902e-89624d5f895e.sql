CREATE OR REPLACE FUNCTION public.reserve_numbers(
  p_campaign_id uuid,
  p_numbers integer[],
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_whatsapp text,
  p_seller_name text DEFAULT NULL,
  p_buyer_cpf text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid;
  v_order_id uuid;
  v_campaign public.campaigns%ROWTYPE;
  v_promotion_id uuid;
  v_quantity integer;
  v_list_amount numeric;
  v_amount numeric;
  v_available integer;
  v_expires_at timestamptz := now() + interval '10 minutes';
BEGIN
  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Campanha indisponível');
  END IF;

  v_quantity := coalesce(array_length(p_numbers, 1), 0);
  IF v_quantity < 1 OR v_quantity > 100 OR v_quantity <> (SELECT count(DISTINCT n) FROM unnest(p_numbers) n) THEN
    RETURN json_build_object('ok', false, 'error', 'Seleção de números inválida');
  END IF;

  PERFORM id
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id AND number = ANY(p_numbers)
  ORDER BY number
  FOR UPDATE;

  SELECT count(*) INTO v_available
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status = 'available';

  IF v_available <> v_quantity THEN
    RETURN json_build_object('ok', false, 'error', 'Um ou mais números não estão disponíveis');
  END IF;

  v_list_amount := round(v_quantity * v_campaign.number_price, 2);

  SELECT id, promotional_price
  INTO v_promotion_id, v_amount
  FROM public.campaign_promotions
  WHERE campaign_id = p_campaign_id
    AND quantity = v_quantity
    AND active = true
  ORDER BY created_at DESC
  LIMIT 1;

  v_amount := coalesce(v_amount, v_list_amount);

  SELECT id INTO v_buyer_id
  FROM public.buyers
  WHERE whatsapp = p_buyer_whatsapp
  ORDER BY created_at
  LIMIT 1;

  IF v_buyer_id IS NULL THEN
    INSERT INTO public.buyers(name, email, whatsapp)
    VALUES (trim(p_buyer_name), nullif(trim(p_buyer_email), ''), p_buyer_whatsapp)
    RETURNING id INTO v_buyer_id;
  ELSE
    UPDATE public.buyers
    SET name = trim(p_buyer_name),
        email = nullif(trim(p_buyer_email), '')
    WHERE id = v_buyer_id;
  END IF;

  INSERT INTO public.orders(
    campaign_id, buyer_id, quantity, amount, list_amount,
    campaign_promotion_id, status, seller_name, expires_at
  )
  VALUES (
    p_campaign_id, v_buyer_id, v_quantity, v_amount, v_list_amount,
    v_promotion_id, 'pending', nullif(trim(p_seller_name), ''), v_expires_at
  )
  RETURNING id INTO v_order_id;

  UPDATE public.raffle_numbers
  SET status = 'reserved',
      buyer_id = v_buyer_id,
      current_order_id = v_order_id,
      reserved_until = v_expires_at
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status = 'available';

  GET DIAGNOSTICS v_available = ROW_COUNT;
  IF v_available <> v_quantity THEN
    RAISE EXCEPTION 'Falha ao reservar todos os números';
  END IF;

  INSERT INTO public.order_numbers(order_id, campaign_id, raffle_number_id, number)
  SELECT v_order_id, p_campaign_id, id, number
  FROM public.raffle_numbers
  WHERE current_order_id = v_order_id;

  RETURN json_build_object(
    'ok', true,
    'order_id', v_order_id,
    'amount', v_amount,
    'list_amount', v_list_amount,
    'promotion_id', v_promotion_id,
    'expires_at', v_expires_at
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_numbers(uuid,integer[],text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(uuid,integer[],text,text,text,text,text) TO anon, authenticated, service_role;

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
  v_expires_at timestamptz := now() + interval '10 minutes';
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