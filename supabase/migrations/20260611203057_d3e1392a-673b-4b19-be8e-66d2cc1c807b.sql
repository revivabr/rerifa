-- Update reserve_numbers to use 3 minutes and set expires_at
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
  v_num INTEGER;
  v_expires TIMESTAMPTZ := now() + interval '3 minutes';
BEGIN
  -- 1. Check/Create buyer
  INSERT INTO public.buyers (name, email, whatsapp)
  VALUES (p_buyer_name, p_buyer_email, p_buyer_whatsapp)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    whatsapp = EXCLUDED.whatsapp
  RETURNING id INTO v_buyer_id;

  -- 2. Verify all requested numbers are available OR expired
  SELECT count(*) INTO v_available_count
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND (status = 'available' OR (status = 'reserved' AND reserved_until < now()));

  IF v_available_count < array_length(p_numbers, 1) THEN
    RETURN json_build_object('ok', false, 'error', 'Alguns números não estão mais disponíveis');
  END IF;

  -- 3. Get campaign price
  SELECT number_price INTO v_price 
  FROM public.campaigns 
  WHERE id = p_campaign_id;

  -- 4. Create the order with seller_name and expires_at
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

  -- 5. Update raffle numbers status and link to order
  UPDATE public.raffle_numbers
  SET status = 'reserved',
      current_order_id = v_order_id,
      buyer_id = v_buyer_id,
      reserved_until = v_expires
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND (status = 'available' OR (status = 'reserved' AND reserved_until < now()));

  -- 6. Insert into order_numbers for easier tracking
  INSERT INTO public.order_numbers (order_id, campaign_id, number, raffle_number_id)
  SELECT v_order_id, p_campaign_id, rn.number, rn.id
  FROM public.raffle_numbers rn
  WHERE rn.current_order_id = v_order_id;

  RETURN json_build_object('ok', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to expire pending orders and release numbers
CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Release numbers from expired reservations
  UPDATE public.raffle_numbers
  SET status = 'available',
      reserved_until = NULL,
      current_order_id = NULL,
      buyer_id = NULL
  WHERE status = 'reserved' AND reserved_until < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Mark expired orders as cancelled/expired
  UPDATE public.orders
  SET status = 'cancelled',
      updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions (redundant but safe)
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO service_role;
