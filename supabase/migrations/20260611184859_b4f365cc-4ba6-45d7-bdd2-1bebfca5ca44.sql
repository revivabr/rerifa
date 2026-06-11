-- Add unique constraint to buyers email if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'buyers_email_key' 
        AND conrelid = 'public.buyers'::regclass
    ) THEN
        ALTER TABLE public.buyers ADD CONSTRAINT buyers_email_key UNIQUE (email);
    END IF;
END $$;

-- Update the reserve_numbers function with better error handling and schema matching
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
  v_available_count INTEGER;
BEGIN
  -- 1. Check/Create buyer
  INSERT INTO public.buyers (name, email, whatsapp)
  VALUES (p_buyer_name, p_buyer_email, p_buyer_whatsapp)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    whatsapp = EXCLUDED.whatsapp
  RETURNING id INTO v_buyer_id;

  -- 2. Verify all requested numbers are available
  SELECT count(*) INTO v_available_count
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status = 'available';

  IF v_available_count < array_length(p_numbers, 1) THEN
    RETURN json_build_object('ok', false, 'error', 'Alguns números não estão mais disponíveis');
  END IF;

  -- 3. Get campaign price
  SELECT number_price INTO v_price 
  FROM public.campaigns 
  WHERE id = p_campaign_id;

  -- 4. Create the order
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

  -- 5. Update raffle numbers status and link to order
  UPDATE public.raffle_numbers
  SET status = 'reserved',
      current_order_id = v_order_id,
      buyer_id = v_buyer_id,
      reserved_until = now() + interval '30 minutes'
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status = 'available';

  RETURN json_build_object('ok', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) TO service_role;
