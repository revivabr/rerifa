CREATE OR REPLACE FUNCTION public.reserve_numbers(
  p_campaign_id UUID,
  p_numbers INTEGER[],
  p_buyer_name TEXT,
  p_buyer_email TEXT,
  p_buyer_whatsapp TEXT
) RETURNS JSON AS $$
DECLARE
  v_buyer_id UUID;
  v_order_id UUID;
  v_price DECIMAL;
BEGIN
  -- 1. Check/Create buyer
  INSERT INTO public.buyers (name, email, whatsapp)
  VALUES (p_buyer_name, p_buyer_email, p_buyer_whatsapp)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    whatsapp = EXCLUDED.whatsapp
  RETURNING id INTO v_buyer_id;

  -- 2. Check if numbers are available
  IF EXISTS (
    SELECT 1 FROM public.raffle_numbers
    WHERE campaign_id = p_campaign_id
      AND number = ANY(p_numbers)
      AND status != 'available'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'Alguns números não estão mais disponíveis');
  END IF;

  -- 3. Get price
  SELECT number_price INTO v_price FROM public.campaigns WHERE id = p_campaign_id;

  -- 4. Create order
  INSERT INTO public.orders (
    campaign_id,
    buyer_id,
    amount,
    status,
    quantity
  ) VALUES (
    p_campaign_id,
    v_buyer_id,
    COALESCE(v_price, 0) * array_length(p_numbers, 1),
    'pending',
    array_length(p_numbers, 1)
  ) RETURNING id INTO v_order_id;

  -- 5. Update raffle numbers
  UPDATE public.raffle_numbers
  SET status = 'reserved',
      current_order_id = v_order_id,
      buyer_id = v_buyer_id,
      reserved_until = now() + interval '30 minutes'
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers);

  RETURN json_build_object('ok', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions just in case
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO service_role;
