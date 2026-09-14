REVOKE SELECT ON public.campaigns FROM anon, authenticated;
GRANT SELECT (id, name, slug, description, banner_url, drive_folder_url, status, number_quantity, number_price, start_date, end_date, draw_date, goal_amount, regulation_text, regulation_url, authorization_url, created_at, updated_at, short_description, prize_description, prize_image_1, prize_image_2) ON public.campaigns TO anon, authenticated;
GRANT ALL ON public.campaigns TO service_role;

REVOKE SELECT ON public.draws FROM anon, authenticated;
GRANT SELECT (id, campaign_id, winner_number, eligible_numbers_count, draw_method, draw_seed, draw_hash, drawn_at, winner_art_url) ON public.draws TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.draws TO authenticated;
GRANT ALL ON public.draws TO service_role;

REVOKE SELECT ON public.raffle_numbers FROM anon;
GRANT SELECT (id, campaign_id, number, status) ON public.raffle_numbers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raffle_numbers TO authenticated;
GRANT ALL ON public.raffle_numbers TO service_role;