-- Create the missing reserve_numbers function
CREATE OR REPLACE FUNCTION public.reserve_numbers(
  p_campaign_id UUID,
  p_numbers INTEGER[],
  p_buyer_name TEXT,
  p_buyer_email TEXT,
  p_buyer_whatsapp TEXT
) RETURNS JSON AS $$
DECLARE
  v_order_id UUID;
  v_count INTEGER;
  v_price DECIMAL;
BEGIN
  -- Check if numbers are available
  SELECT count(*) INTO v_count
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status = 'available';

  IF v_count < array_length(p_numbers, 1) THEN
    RETURN json_build_object('ok', false, 'error', 'Alguns números não estão mais disponíveis');
  END IF;

  -- Get price
  SELECT number_price INTO v_price FROM public.campaigns WHERE id = p_campaign_id;

  -- Create order
  INSERT INTO public.orders (
    campaign_id,
    buyer_name,
    buyer_email,
    buyer_whatsapp,
    total_amount,
    status
  ) VALUES (
    p_campaign_id,
    p_buyer_name,
    p_buyer_email,
    p_buyer_whatsapp,
    COALESCE(v_price, 0) * array_length(p_numbers, 1),
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Update numbers
  UPDATE public.raffle_numbers
  SET status = 'reserved',
      order_id = v_order_id,
      updated_at = now()
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers);

  RETURN json_build_object('ok', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO anon;