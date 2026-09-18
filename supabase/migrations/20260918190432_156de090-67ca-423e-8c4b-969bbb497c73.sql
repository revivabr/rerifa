-- lovable-cron-fallback-reviewed: 1440 runs/day; reservas vencem em 180 segundos e o provedor não oferece execução atrasada por pedido, então a verificação por minuto limita a liberação adicional a cerca de 60 segundos mesmo com a aba fechada
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.pix_maintenance_tokens (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  token text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pix_maintenance_tokens TO service_role;
ALTER TABLE public.pix_maintenance_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages PIX maintenance tokens"
ON public.pix_maintenance_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO public.pix_maintenance_tokens(id, token, token_hash)
VALUES (
  true,
  gen_random_uuid()::text || gen_random_uuid()::text,
  'pending'
);

UPDATE public.pix_maintenance_tokens
SET token_hash = encode(extensions.digest(token, 'sha256'), 'hex')
WHERE id = true;

CREATE OR REPLACE FUNCTION public.verify_pix_maintenance_token(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pix_maintenance_tokens
    WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  );
$$;
REVOKE ALL ON FUNCTION public.verify_pix_maintenance_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_pix_maintenance_token(text) TO service_role;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'pix-maintenance-every-minute';

SELECT cron.schedule(
  'pix-maintenance-every-minute',
  '* * * * *',
  $schedule$
    SELECT net.http_post(
      url := 'https://rifa.revivabrasil.com.br/api/public/internal/pix-maintenance',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT token FROM public.pix_maintenance_tokens WHERE id = true)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 50000
    );
  $schedule$
);