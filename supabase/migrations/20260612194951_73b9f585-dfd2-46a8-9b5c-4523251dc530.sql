-- Restore Data API access on raffle_numbers (policies already restrict appropriately)
GRANT SELECT ON public.raffle_numbers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raffle_numbers TO authenticated;
GRANT ALL ON public.raffle_numbers TO service_role;

-- Also ensure buyers joined data is reachable for admin views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyers TO authenticated;
GRANT ALL ON public.buyers TO service_role;

-- Draws table (admin panel)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.draws TO authenticated;
GRANT ALL ON public.draws TO service_role;