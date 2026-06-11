-- ---------- DRAWS ----------
create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id),
  winner_number int not null,
  winner_buyer_id uuid references public.buyers(id),
  winner_order_id uuid references public.orders(id),
  eligible_numbers_count int not null,
  draw_method text not null,
  draw_seed text,
  draw_hash text,
  drawn_by uuid references public.admin_users(id),
  drawn_at timestamptz default now(),
  winner_art_url text
);

-- ---------- AUDIT LOGS ----------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table public.draws enable row level security;
alter table public.audit_logs enable row level security;

-- Permissões
grant select on public.draws to anon, authenticated;
grant select, insert, update, delete on public.draws to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant all on public.draws to service_role;
grant all on public.audit_logs to service_role;

-- Políticas
create policy "draws public read" on public.draws for select to anon, authenticated using (true);
create policy "draws admin write" on public.draws for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audit admin" on public.audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Garantir que is_admin() está correto
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_users where auth_user_id = auth.uid())
$$;
