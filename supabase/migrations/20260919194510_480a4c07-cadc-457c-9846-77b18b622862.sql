CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_count integer := 0;
BEGIN
  FOR v_order IN
    SELECT id
    FROM public.orders
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at <= now() - interval '30 seconds'
      AND payment_provider_id IS NULL
      AND (
        pix_generation_status IS DISTINCT FROM 'processing'
        OR pix_generation_started_at IS NULL
        OR pix_generation_started_at <= now() - interval '2 minutes'
      )
    ORDER BY expires_at
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.orders
    SET status = 'cancelled', updated_at = now()
    WHERE id = v_order.id AND status = 'pending';

    IF FOUND THEN
      UPDATE public.raffle_numbers
      SET status = 'available', reserved_until = NULL, current_order_id = NULL, buyer_id = NULL
      WHERE current_order_id = v_order.id AND status = 'reserved';
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_pending_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO service_role;

REVOKE ALL ON FUNCTION public.reserve_numbers(uuid,integer[],text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_numbers(uuid,integer[],text,text,text,text,text) TO service_role;