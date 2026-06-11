-- 1. Limpeza de compradores duplicados por WhatsApp
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT whatsapp, array_agg(id ORDER BY created_at ASC) as ids
        FROM public.buyers
        GROUP BY whatsapp
        HAVING count(*) > 1
    ) LOOP
        -- Atualizar pedidos para apontar para o primeiro ID (mais antigo)
        UPDATE public.orders SET buyer_id = r.ids[1] WHERE buyer_id = ANY(r.ids[2:array_length(r.ids, 1)]);
        
        -- Atualizar raffle_numbers
        UPDATE public.raffle_numbers SET buyer_id = r.ids[1] WHERE buyer_id = ANY(r.ids[2:array_length(r.ids, 1)]);
        
        -- Deletar os duplicados
        DELETE FROM public.buyers WHERE id = ANY(r.ids[2:array_length(r.ids, 1)]);
    END LOOP;
END $$;

-- 2. Adicionar constraint UNIQUE no whatsapp
ALTER TABLE public.buyers DROP CONSTRAINT IF EXISTS buyers_whatsapp_key;
ALTER TABLE public.buyers ADD CONSTRAINT buyers_whatsapp_key UNIQUE (whatsapp);

-- 3. Melhorar a função reserve_numbers
CREATE OR REPLACE FUNCTION public.reserve_numbers(
  p_campaign_id UUID,
  p_numbers INTEGER[],
  p_buyer_name TEXT,
  p_buyer_email TEXT,
  p_buyer_whatsapp TEXT,
  p_seller_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_buyer_id UUID;
  v_order_id UUID;
  v_price DECIMAL;
  v_available_count INTEGER;
  v_expires TIMESTAMPTZ := now() + interval '3 minutes';
  v_clean_email TEXT;
BEGIN
  v_clean_email := NULLIF(TRIM(p_buyer_email), '');

  -- Usar WhatsApp como chave única para o comprador
  INSERT INTO public.buyers (name, email, whatsapp)
  VALUES (p_buyer_name, v_clean_email, p_buyer_whatsapp)
  ON CONFLICT (whatsapp) DO UPDATE SET
    name = EXCLUDED.name,
    email = COALESCE(v_clean_email, buyers.email)
  RETURNING id INTO v_buyer_id;

  SELECT count(*) INTO v_available_count
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND (status = 'available' OR (status = 'reserved' AND reserved_until < now()));

  IF v_available_count < array_length(p_numbers, 1) THEN
    RETURN json_build_object('ok', false, 'error', 'Alguns números não estão mais disponíveis');
  END IF;

  SELECT number_price INTO v_price 
  FROM public.campaigns 
  WHERE id = p_campaign_id;

  INSERT INTO public.orders (
    campaign_id,
    buyer_id,
    amount,
    status,
    quantity,
    seller_name,
    expires_at
  ) VALUES (
    p_campaign_id,
    v_buyer_id,
    COALESCE(v_price, 0) * array_length(p_numbers, 1),
    'pending',
    array_length(p_numbers, 1),
    p_seller_name,
    v_expires
  ) RETURNING id INTO v_order_id;

  UPDATE public.raffle_numbers
  SET status = 'reserved',
      current_order_id = v_order_id,
      buyer_id = v_buyer_id,
      reserved_until = v_expires
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND (status = 'available' OR (status = 'reserved' AND reserved_until < now()));

  INSERT INTO public.order_numbers (order_id, campaign_id, number, raffle_number_id)
  SELECT v_order_id, p_campaign_id, rn.number, rn.id
  FROM public.raffle_numbers rn
  WHERE rn.current_order_id = v_order_id;

  RETURN json_build_object('ok', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Criar função para confirmar pagamento
CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_order_id UUID,
  p_external_id TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Pedido não encontrado');
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN json_build_object('ok', true, 'already_paid', true);
  END IF;

  UPDATE public.orders 
  SET status = 'paid',
      paid_at = now(),
      payment_provider_id = COALESCE(p_external_id, payment_provider_id),
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.raffle_numbers
  SET status = 'sold',
      reserved_until = NULL
  WHERE current_order_id = p_order_id;

  RETURN json_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Permissões
GRANT EXECUTE ON FUNCTION public.confirm_payment(UUID, TEXT) TO service_role;
GRANT ALL ON public.buyers TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.raffle_numbers TO service_role;
GRANT ALL ON public.order_numbers TO service_role;
