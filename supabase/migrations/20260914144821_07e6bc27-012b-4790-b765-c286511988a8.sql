REVOKE ALL ON TABLE public.campaigns FROM anon, authenticated;
GRANT SELECT (id, name, slug, description, banner_url, status, number_quantity, number_price, start_date, end_date, draw_date, goal_amount, regulation_text, regulation_url, short_description, prize_description, prize_image_1, prize_image_2, created_at, updated_at) ON public.campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaigns TO authenticated;
GRANT ALL ON TABLE public.campaigns TO service_role;

REVOKE ALL ON TABLE public.raffle_numbers FROM anon, authenticated;
GRANT SELECT (id, campaign_id, number, status) ON public.raffle_numbers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.raffle_numbers TO authenticated;
GRANT ALL ON TABLE public.raffle_numbers TO service_role;

REVOKE ALL ON TABLE public.draws FROM anon, authenticated;
GRANT SELECT (id, campaign_id, winner_number, eligible_numbers_count, draw_method, draw_hash, drawn_at, winner_art_url) ON public.draws TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.draws TO authenticated;
GRANT ALL ON TABLE public.draws TO service_role;