-- 1. Limpeza total para recomeçar do zero
TRUNCATE public.payments CASCADE;
TRUNCATE public.order_numbers CASCADE;
TRUNCATE public.orders CASCADE;
TRUNCATE public.buyers CASCADE;
DELETE FROM public.raffle_numbers;

-- 2. Popular os números da rifa para a campanha ativa
-- Assumindo a campanha de ID 9fedce48-f1fe-4570-88e6-3299e8e268ef
INSERT INTO public.raffle_numbers (campaign_id, number, status, created_at)
SELECT 
  '9fedce48-f1fe-4570-88e6-3299e8e268ef'::uuid,
  generate_series(1, 200),
  'available',
  now();

-- 3. Garantir que a função reserve_numbers use 3 minutos (já atualizada anteriormente, mas reforçando)
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

  -- Verifica disponibilidade considerando expiração
  SELECT count(*) INTO v_available_count
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND (status = 'available' OR (status = 'reserved' AND (reserved_until IS NULL OR reserved_until < now())));

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

  -- Atualiza status
  UPDATE public.raffle_numbers
  SET status = 'reserved',
      current_order_id = v_order_id,
      buyer_id = v_buyer_id,
      reserved_until = v_expires
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND (status = 'available' OR (status = 'reserved' AND (reserved_until IS NULL OR reserved_until < now())));

  INSERT INTO public.order_numbers (order_id, campaign_id, number, raffle_number_id)
  SELECT v_order_id, p_campaign_id, rn.number, rn.id
  FROM public.raffle_numbers rn
  WHERE rn.current_order_id = v_order_id;

  RETURN json_build_object('ok', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
