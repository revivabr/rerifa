CREATE OR REPLACE FUNCTION public.start_pix_payment_window(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_expires_at timestamptz := now() + interval '180 seconds';
BEGIN
  UPDATE public.orders
  SET expires_at = v_expires_at,
      updated_at = now()
  WHERE id = p_order_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  UPDATE public.raffle_numbers
  SET reserved_until = v_expires_at
  WHERE current_order_id = p_order_id
    AND status = 'reserved';

  RETURN jsonb_build_object('ok', true, 'expires_at', v_expires_at);
END;
$function$;

REVOKE ALL ON FUNCTION public.start_pix_payment_window(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_pix_payment_window(uuid) TO service_role;