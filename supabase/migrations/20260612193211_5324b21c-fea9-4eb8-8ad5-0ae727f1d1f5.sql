REVOKE SELECT (pix_key) ON public.campaigns FROM anon;
REVOKE SELECT (winner_buyer_id) ON public.draws FROM anon;
REVOKE SELECT (buyer_id, reserved_until, current_order_id, sold_at) ON public.raffle_numbers FROM anon;