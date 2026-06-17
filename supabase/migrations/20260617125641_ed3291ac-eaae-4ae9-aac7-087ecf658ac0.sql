REVOKE SELECT (pix_key) ON public.campaigns FROM anon, authenticated;
REVOKE SELECT (winner_buyer_id, winner_order_id) ON public.draws FROM anon, authenticated;
REVOKE SELECT (buyer_id, current_order_id, reserved_until, sold_at) ON public.raffle_numbers FROM anon, authenticated;