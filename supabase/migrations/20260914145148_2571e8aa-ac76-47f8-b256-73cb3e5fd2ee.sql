DROP POLICY IF EXISTS "campaign promotions public read" ON public.campaign_promotions;
CREATE POLICY "campaign promotions public active read"
ON public.campaign_promotions
FOR SELECT
TO anon
USING (active);
CREATE POLICY "campaign promotions authenticated read"
ON public.campaign_promotions
FOR SELECT
TO authenticated
USING (active OR public.is_admin());