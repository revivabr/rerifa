-- Add new fields for campaign card layout
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS prize_description TEXT,
  ADD COLUMN IF NOT EXISTS prize_image_1 TEXT,
  ADD COLUMN IF NOT EXISTS prize_image_2 TEXT;

-- Security fix: restrict columns exposed by raffle_numbers public read.
-- Revoke broad SELECT and grant only safe columns to anon/authenticated.
REVOKE SELECT ON public.raffle_numbers FROM anon;
REVOKE SELECT ON public.raffle_numbers FROM authenticated;

GRANT SELECT (id, campaign_id, number, status) ON public.raffle_numbers TO anon;
GRANT SELECT (id, campaign_id, number, status) ON public.raffle_numbers TO authenticated;
-- Admins/service role keep full access
GRANT ALL ON public.raffle_numbers TO service_role;