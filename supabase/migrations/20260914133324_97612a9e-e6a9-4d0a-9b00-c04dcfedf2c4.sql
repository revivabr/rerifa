DROP POLICY IF EXISTS "campaigns public read" ON public.campaigns;
CREATE POLICY "campaigns public read" ON public.campaigns FOR SELECT TO anon USING (status = ANY (ARRAY['active'::text, 'paused'::text, 'finished'::text, 'drawn'::text]));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;

DROP POLICY IF EXISTS "draws public read" ON public.draws;
CREATE POLICY "draws public read" ON public.draws FOR SELECT TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.draws TO authenticated;

DROP POLICY IF EXISTS "raffle public read" ON public.raffle_numbers;
CREATE POLICY "raffle public read" ON public.raffle_numbers FOR SELECT TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raffle_numbers TO authenticated;