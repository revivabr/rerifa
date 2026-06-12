-- Hide sensitive columns from public (anon) access while keeping admin (authenticated) access intact.
REVOKE SELECT (pix_key) ON public.campaigns FROM anon;
REVOKE SELECT (winner_buyer_id) ON public.draws FROM anon;