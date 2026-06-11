CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_campaign_id UUID;
BEGIN
    -- 1. Get campaign_id and verify order is pending
    SELECT campaign_id INTO v_campaign_id
    FROM public.orders
    WHERE id = p_order_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado ou já processado');
    END IF;

    -- 2. Update order status to cancelled
    UPDATE public.orders
    SET status = 'cancelled'
    WHERE id = p_order_id;

    -- 3. Release numbers in raffle_numbers
    UPDATE public.raffle_numbers
    SET status = 'available',
        reserved_until = NULL,
        order_id = NULL
    WHERE order_id = p_order_id;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(UUID) TO authenticated, anon;
