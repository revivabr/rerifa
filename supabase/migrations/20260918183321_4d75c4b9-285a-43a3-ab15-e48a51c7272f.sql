ALTER TABLE public.orders
  ADD COLUMN pix_generation_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN pix_generation_started_at timestamptz,
  ADD COLUMN pix_generation_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN pix_generation_error_code text,
  ADD CONSTRAINT orders_pix_generation_status_check CHECK (pix_generation_status IN ('not_started','processing','ready','failed'));

UPDATE public.orders
SET pix_generation_status = CASE
  WHEN pix_qr_code IS NOT NULL AND pix_copy_paste IS NOT NULL THEN 'ready'
  ELSE 'not_started'
END;

CREATE TABLE public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'mercadopago',
  provider_payment_id text,
  event_type text NOT NULL,
  processing_status text NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received','processed','ignored','failed')),
  error_code text,
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT ALL ON public.payment_webhook_events TO service_role;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payment_reconciliation_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider_payment_id text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'refund_pending' CHECK (status IN ('refund_pending','refund_processing','refunded','manual_review','refund_failed')),
  refund_provider_id text,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (provider_payment_id)
);
GRANT ALL ON public.payment_reconciliation_issues TO service_role;
ALTER TABLE public.payment_reconciliation_issues ENABLE ROW LEVEL SECURITY;

CREATE INDEX payment_webhook_events_payment_idx ON public.payment_webhook_events(provider_payment_id, received_at DESC);
CREATE INDEX payment_reconciliation_status_idx ON public.payment_reconciliation_issues(status, created_at);
CREATE INDEX orders_pix_generation_idx ON public.orders(status, pix_generation_status, expires_at);

CREATE OR REPLACE FUNCTION public.claim_pix_generation(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado');
  END IF;
  IF v_order.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', true, 'state', v_order.status);
  END IF;
  IF v_order.pix_generation_status = 'ready' AND v_order.pix_qr_code IS NOT NULL AND v_order.pix_copy_paste IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'state', 'ready', 'expires_at', v_order.expires_at);
  END IF;
  IF v_order.pix_generation_status = 'processing'
     AND v_order.pix_generation_started_at > now() - interval '20 seconds' THEN
    RETURN jsonb_build_object('ok', true, 'state', 'processing');
  END IF;

  UPDATE public.orders
  SET pix_generation_status = 'processing',
      pix_generation_started_at = now(),
      pix_generation_attempts = pix_generation_attempts + 1,
      pix_generation_error_code = NULL,
      updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'state', 'claimed');
END;
$$;
REVOKE ALL ON FUNCTION public.claim_pix_generation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pix_generation(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_pix_generation(
  p_order_id uuid,
  p_qr_code text,
  p_copy_paste text,
  p_provider_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_expires_at timestamptz := now() + interval '180 seconds';
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  IF v_order.pix_generation_status = 'ready' AND v_order.payment_provider_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'state', 'ready', 'expires_at', v_order.expires_at);
  END IF;

  UPDATE public.orders
  SET pix_qr_code = p_qr_code,
      pix_copy_paste = p_copy_paste,
      payment_provider_id = p_provider_id,
      payment_provider = 'mercadopago',
      pix_generation_status = 'ready',
      pix_generation_error_code = NULL,
      expires_at = v_expires_at,
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.raffle_numbers
  SET reserved_until = v_expires_at
  WHERE current_order_id = p_order_id AND status = 'reserved';

  RETURN jsonb_build_object('ok', true, 'state', 'ready', 'expires_at', v_expires_at);
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_pix_generation(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_pix_generation(uuid,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.fail_pix_generation(p_order_id uuid, p_error_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET pix_generation_status = 'failed',
      pix_generation_error_code = left(coalesce(p_error_code, 'unknown'), 100),
      updated_at = now()
  WHERE id = p_order_id
    AND status = 'pending'
    AND pix_generation_status = 'processing'
    AND payment_provider_id IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.fail_pix_generation(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_pix_generation(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.confirm_payment(p_order_id uuid, p_external_id text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_number_count integer;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'error', 'Pedido não encontrado'); END IF;
  IF v_order.status = 'paid' THEN RETURN json_build_object('ok', true, 'already_paid', true); END IF;

  SELECT count(*) INTO v_number_count
  FROM public.raffle_numbers
  WHERE current_order_id = p_order_id AND status IN ('reserved','sold');

  IF v_order.status <> 'pending' OR v_number_count <> v_order.quantity THEN
    INSERT INTO public.payment_reconciliation_issues(order_id, provider_payment_id, amount, reason)
    VALUES (p_order_id, coalesce(p_external_id, v_order.payment_provider_id), v_order.amount, 'numbers_released_or_reassigned')
    ON CONFLICT (provider_payment_id) DO NOTHING;
    RETURN json_build_object('ok', false, 'requires_refund', true, 'error', 'Pagamento aprovado após a liberação dos números');
  END IF;

  UPDATE public.orders
  SET status = 'paid', paid_at = coalesce(paid_at, now()), payment_provider = 'mercadopago',
      payment_provider_id = coalesce(p_external_id, payment_provider_id), updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.raffle_numbers
  SET status = 'sold', reserved_until = NULL, sold_at = coalesce(sold_at, now())
  WHERE current_order_id = p_order_id AND status IN ('reserved','sold');

  INSERT INTO public.payments(order_id, campaign_id, provider, provider_payment_id, status, amount, confirmed_at)
  VALUES (v_order.id, v_order.campaign_id, 'mercadopago', coalesce(p_external_id, v_order.payment_provider_id), 'approved', v_order.amount, now());

  RETURN json_build_object('ok', true);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('ok', true, 'already_paid', true);
WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_payment(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_payment(uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_count integer := 0;
BEGIN
  FOR v_order IN
    SELECT id FROM public.orders
    WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at <= now()
      AND payment_provider_id IS NULL
    ORDER BY expires_at
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = v_order.id AND status = 'pending';
    IF FOUND THEN
      UPDATE public.raffle_numbers
      SET status = 'available', reserved_until = NULL, current_order_id = NULL, buyer_id = NULL
      WHERE current_order_id = v_order.id AND status = 'reserved';
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_pending_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO service_role;

CREATE OR REPLACE FUNCTION public.mark_reconciliation_result(
  p_provider_payment_id text,
  p_status text,
  p_refund_provider_id text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order_id uuid;
BEGIN
  IF p_status NOT IN ('refund_processing','refunded','manual_review','refund_failed') THEN
    RAISE EXCEPTION 'Situação de reconciliação inválida';
  END IF;
  UPDATE public.payment_reconciliation_issues
  SET status = p_status,
      refund_provider_id = coalesce(p_refund_provider_id, refund_provider_id),
      attempt_count = attempt_count + 1,
      last_error = left(p_error, 500),
      updated_at = now(),
      resolved_at = CASE WHEN p_status = 'refunded' THEN now() ELSE resolved_at END
  WHERE provider_payment_id = p_provider_payment_id
  RETURNING order_id INTO v_order_id;
  IF p_status = 'refunded' AND v_order_id IS NOT NULL THEN
    UPDATE public.orders SET status = 'refunded', updated_at = now() WHERE id = v_order_id AND status <> 'paid';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_reconciliation_result(text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_reconciliation_result(text,text,text,text) TO service_role;