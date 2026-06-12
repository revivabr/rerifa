CREATE OR REPLACE FUNCTION public.get_seller_ranking(p_campaign_id uuid)
RETURNS TABLE(seller_name text, total_sales bigint, total_amount numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    TRIM(o.seller_name) AS seller_name,
    SUM(o.quantity)::bigint AS total_sales,
    SUM(o.amount)::numeric AS total_amount
  FROM public.orders o
  WHERE o.campaign_id = p_campaign_id
    AND o.status = 'paid'
    AND o.seller_name IS NOT NULL
    AND TRIM(o.seller_name) <> ''
  GROUP BY TRIM(o.seller_name)
  ORDER BY total_sales DESC, total_amount DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_ranking(uuid) TO anon, authenticated;