CREATE TABLE public.campaign_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 1),
  promotional_price numeric(10,2) NOT NULL CHECK (promotional_price > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, quantity)
);

GRANT SELECT ON public.campaign_promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campaign_promotions TO authenticated;
GRANT ALL ON public.campaign_promotions TO service_role;

ALTER TABLE public.campaign_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign promotions public read"
ON public.campaign_promotions
FOR SELECT
TO anon, authenticated
USING (active OR public.is_admin());

CREATE POLICY "campaign promotions admin insert"
ON public.campaign_promotions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "campaign promotions admin update"
ON public.campaign_promotions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "campaign promotions admin delete"
ON public.campaign_promotions
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE INDEX idx_campaign_promotions_campaign_active
ON public.campaign_promotions(campaign_id, active, quantity);

ALTER TABLE public.orders
  ADD COLUMN list_amount numeric(10,2),
  ADD COLUMN campaign_promotion_id uuid REFERENCES public.campaign_promotions(id) ON DELETE SET NULL;

UPDATE public.orders SET list_amount = amount WHERE list_amount IS NULL;
ALTER TABLE public.orders ALTER COLUMN list_amount SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_campaign_promotion_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaign_promotion_updated_at
BEFORE UPDATE ON public.campaign_promotions
FOR EACH ROW EXECUTE FUNCTION public.set_campaign_promotion_updated_at();

CREATE OR REPLACE FUNCTION public.reserve_numbers(
  p_campaign_id uuid,
  p_numbers integer[],
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_whatsapp text,
  p_seller_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid;
  v_order_id uuid;
  v_campaign public.campaigns%rowtype;
  v_promotion public.campaign_promotions%rowtype;
  v_available_count integer;
  v_quantity integer;
  v_list_amount numeric(10,2);
  v_amount numeric(10,2);
  v_expires timestamptz := now() + interval '3 minutes';
  v_clean_email text;
BEGIN
  v_clean_email := NULLIF(TRIM(p_buyer_email), '');
  v_quantity := COALESCE(array_length(p_numbers, 1), 0);

  IF v_quantity = 0 THEN
    RETURN json_build_object('ok', false, 'error', 'Selecione pelo menos um número');
  END IF;

  IF v_quantity <> (SELECT count(DISTINCT n) FROM unnest(p_numbers) AS n) THEN
    RETURN json_build_object('ok', false, 'error', 'A seleção contém números repetidos');
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id;

  IF v_campaign.id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Campanha não encontrada');
  END IF;

  IF v_campaign.status <> 'active' THEN
    RETURN json_build_object('ok', false, 'error', 'Campanha não está ativa');
  END IF;

  PERFORM id
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
  FOR UPDATE;

  SELECT count(*) INTO v_available_count
  FROM public.raffle_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND (status = 'available' OR (status = 'reserved' AND (reserved_until IS NULL OR reserved_until < now())));

  IF v_available_count <> v_quantity THEN
    RETURN json_build_object('ok', false, 'error', 'Alguns números não estão mais disponíveis');
  END IF;

  v_list_amount := round(v_campaign.number_price * v_quantity, 2);

  SELECT * INTO v_promotion
  FROM public.campaign_promotions
  WHERE campaign_id = p_campaign_id
    AND quantity = v_quantity
    AND active = true
  LIMIT 1;

  v_amount := CASE
    WHEN v_promotion.id IS NOT NULL THEN v_promotion.promotional_price
    ELSE v_list_amount
  END;

  INSERT INTO public.buyers (name, email, whatsapp)
  VALUES (p_buyer_name, v_clean_email, p_buyer_whatsapp)
  ON CONFLICT (whatsapp) DO UPDATE SET
    name = EXCLUDED.name,
    email = COALESCE(v_clean_email, buyers.email)
  RETURNING id INTO v_buyer_id;

  INSERT INTO public.orders (
    campaign_id, buyer_id, amount, list_amount, campaign_promotion_id,
    status, quantity, expires_at, seller_name
  ) VALUES (
    p_campaign_id, v_buyer_id, v_amount, v_list_amount, v_promotion.id,
    'pending', v_quantity, v_expires, NULLIF(TRIM(p_seller_name), '')
  ) RETURNING id INTO v_order_id;

  UPDATE public.raffle_numbers
  SET status = 'reserved',
      current_order_id = v_order_id,
      buyer_id = v_buyer_id,
      reserved_until = v_expires
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers);

  INSERT INTO public.order_numbers (order_id, campaign_id, number, raffle_number_id)
  SELECT v_order_id, p_campaign_id, rn.number, rn.id
  FROM public.raffle_numbers rn
  WHERE rn.current_order_id = v_order_id;

  RETURN json_build_object(
    'ok', true,
    'order_id', v_order_id,
    'amount', v_amount,
    'list_amount', v_list_amount,
    'promotion_id', v_promotion.id,
    'expires_at', v_expires
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

INSERT INTO public.campaign_promotions (campaign_id, quantity, promotional_price, active)
SELECT id, 3, 50.00, true
FROM public.campaigns
WHERE slug = 'voodobem'
ON CONFLICT (campaign_id, quantity)
DO UPDATE SET promotional_price = EXCLUDED.promotional_price, active = true, updated_at = now();