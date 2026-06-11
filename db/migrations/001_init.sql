-- =====================================================
-- Reviva Brasil — Rifa Solidária — Schema inicial
-- Rode no SQL Editor do seu projeto Supabase EXTERNO.
-- =====================================================

create extension if not exists pgcrypto;

-- ---------- ADMIN USERS ----------
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  name text,
  email text not null unique,
  role text not null default 'admin' check (role in ('super_admin','admin','viewer')),
  created_at timestamptz default now()
);

-- Note: To log in as admin@revivabrasil.com.br, first create the user in Supabase Auth (Users tab)
-- with the password 'reviva123', then copy their ID and run:
-- INSERT INTO public.admin_users (auth_user_id, email, role) VALUES ('PASTE-THE-ID-HERE', 'admin@revivabrasil.com.br', 'super_admin');


create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_users where auth_user_id = auth.uid())
$$;

-- ---------- CAMPAIGNS ----------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  banner_url text,
  status text not null default 'draft' check (status in ('draft','active','paused','finished','drawn','cancelled')),
  number_quantity int not null check (number_quantity between 100 and 1000),
  number_price numeric(10,2) not null check (number_price > 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  draw_date timestamptz,
  goal_amount numeric(10,2),
  pix_key text,
  regulation_url text,
  authorization_url text,
  created_by uuid references public.admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_slug on public.campaigns(slug);

create table if not exists public.campaign_prizes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  position int default 1,
  created_at timestamptz default now()
);

create table if not exists public.buyers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  whatsapp text not null,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id),
  buyer_id uuid references public.buyers(id),
  status text not null default 'pending' check (status in ('pending','paid','expired','cancelled','refunded')),
  amount numeric(10,2) not null,
  quantity int not null,
  pix_qr_code text,
  pix_copy_paste text,
  payment_provider text,
  payment_provider_id text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_orders_campaign on public.orders(campaign_id);
create index if not exists idx_orders_status on public.orders(status);

create table if not exists public.raffle_numbers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  number int not null,
  status text not null default 'available' check (status in ('available','reserved','sold','cancelled','winner')),
  current_order_id uuid references public.orders(id) on delete set null,
  buyer_id uuid references public.buyers(id) on delete set null,
  sold_at timestamptz,
  reserved_until timestamptz,
  created_at timestamptz default now(),
  unique(campaign_id, number)
);
create index if not exists idx_raffle_campaign_status on public.raffle_numbers(campaign_id, status);

create table if not exists public.order_numbers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  raffle_number_id uuid references public.raffle_numbers(id),
  campaign_id uuid references public.campaigns(id),
  number int not null,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  campaign_id uuid references public.campaigns(id),
  provider text not null,
  provider_payment_id text,
  status text not null,
  amount numeric(10,2) not null,
  payload jsonb,
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

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

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- =====================================================
-- RPC: reservar números (atomicidade)
-- =====================================================
create or replace function public.reserve_numbers(
  p_campaign_id uuid,
  p_numbers int[],
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_whatsapp text
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_campaign public.campaigns%rowtype;
  v_buyer_id uuid;
  v_order_id uuid;
  v_amount numeric(10,2);
  v_qty int;
  v_locked int;
  v_expires timestamptz := now() + interval '15 minutes';
  v_num int;
  v_rn_id uuid;
begin
  select * into v_campaign from public.campaigns where id = p_campaign_id;
  if v_campaign.id is null then
    return jsonb_build_object('ok', false, 'error', 'Campanha não encontrada');
  end if;
  if v_campaign.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'Campanha não está ativa');
  end if;
  v_qty := array_length(p_numbers, 1);
  if v_qty is null or v_qty = 0 then
    return jsonb_build_object('ok', false, 'error', 'Nenhum número informado');
  end if;
  select count(*) into v_locked
    from public.raffle_numbers
    where campaign_id = p_campaign_id and number = any(p_numbers)
      and (status = 'available' or (status = 'reserved' and reserved_until < now()));
  if v_locked <> v_qty then
    return jsonb_build_object('ok', false, 'error', 'Algum número já não está mais disponível');
  end if;
  v_amount := v_campaign.number_price * v_qty;
  insert into public.buyers(name, email, whatsapp)
    values (p_buyer_name, nullif(p_buyer_email,''), p_buyer_whatsapp)
    returning id into v_buyer_id;
  insert into public.orders(campaign_id, buyer_id, status, amount, quantity, expires_at, payment_provider)
    values (p_campaign_id, v_buyer_id, 'pending', v_amount, v_qty, v_expires, 'mock')
    returning id into v_order_id;
  foreach v_num in array p_numbers loop
    update public.raffle_numbers
       set status = 'reserved', reserved_until = v_expires,
           current_order_id = v_order_id, buyer_id = v_buyer_id
     where campaign_id = p_campaign_id and number = v_num;
    select id into v_rn_id from public.raffle_numbers
      where campaign_id = p_campaign_id and number = v_num;
    insert into public.order_numbers(order_id, raffle_number_id, campaign_id, number)
      values (v_order_id, v_rn_id, p_campaign_id, v_num);
  end loop;
  return jsonb_build_object('ok', true, 'order_id', v_order_id, 'amount', v_amount, 'expires_at', v_expires);
end;
$$;

create or replace function public.confirm_order_payment(p_order_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    return jsonb_build_object('ok', false, 'error', 'Pedido não encontrado');
  end if;
  if v_order.status = 'paid' then return jsonb_build_object('ok', true, 'already', true); end if;
  update public.orders set status = 'paid', paid_at = now(), updated_at = now() where id = p_order_id;
  update public.raffle_numbers set status = 'sold', sold_at = now(), reserved_until = null where current_order_id = p_order_id;
  insert into public.payments(order_id, campaign_id, provider, status, amount, confirmed_at)
    values (p_order_id, v_order.campaign_id, coalesce(v_order.payment_provider,'mock'), 'paid', v_order.amount, now());
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.expire_pending_orders()
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  update public.raffle_numbers
    set status = 'available', reserved_until = null, current_order_id = null, buyer_id = null
    where status = 'reserved' and reserved_until < now();
  get diagnostics v_count = row_count;
  update public.orders set status = 'expired', updated_at = now()
    where status = 'pending' and expires_at < now();
  return v_count;
end;
$$;

create or replace function public.seed_raffle_numbers()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.raffle_numbers(campaign_id, number, status)
  select new.id, gs, 'available' from generate_series(1, new.number_quantity) gs;
  return new;
end;
$$;
drop trigger if exists trg_seed_raffle on public.campaigns;
create trigger trg_seed_raffle after insert on public.campaigns
for each row execute function public.seed_raffle_numbers();

-- =====================================================
-- GRANTS
-- =====================================================
grant select on public.campaigns to anon, authenticated;
grant select on public.campaign_prizes to anon, authenticated;
grant select on public.raffle_numbers to anon, authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.campaign_prizes to authenticated;
grant select, insert, update, delete on public.raffle_numbers to authenticated;
grant select, insert, update, delete on public.buyers to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_numbers to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.draws to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select on public.orders to anon;
grant select on public.order_numbers to anon;
grant select on public.draws to anon;
grant execute on function public.reserve_numbers(uuid,int[],text,text,text) to anon, authenticated;
grant execute on function public.confirm_order_payment(uuid) to authenticated;
grant execute on function public.expire_pending_orders() to anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all functions in schema public to service_role;

-- =====================================================
-- RLS
-- =====================================================
alter table public.admin_users enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_prizes enable row level security;
alter table public.raffle_numbers enable row level security;
alter table public.buyers enable row level security;
alter table public.orders enable row level security;
alter table public.order_numbers enable row level security;
alter table public.payments enable row level security;
alter table public.draws enable row level security;
alter table public.audit_logs enable row level security;

create policy "admin_users self read"   on public.admin_users for select to authenticated using (auth_user_id = auth.uid() or public.is_admin());
create policy "admin_users admin write" on public.admin_users for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "campaigns public read" on public.campaigns for select to anon, authenticated
  using (status in ('active','paused','finished','drawn') or public.is_admin());
create policy "campaigns admin write" on public.campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "prizes public read" on public.campaign_prizes for select to anon, authenticated using (true);
create policy "prizes admin write" on public.campaign_prizes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "raffle public read" on public.raffle_numbers for select to anon, authenticated using (true);
create policy "raffle admin write" on public.raffle_numbers for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "buyers admin read"  on public.buyers for select to authenticated using (public.is_admin());
create policy "buyers admin write" on public.buyers for all   to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "orders public read" on public.orders for select to anon, authenticated using (true);
create policy "orders admin write" on public.orders for all   to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "order_numbers public read" on public.order_numbers for select to anon, authenticated using (true);
create policy "order_numbers admin write" on public.order_numbers for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "payments admin"  on public.payments  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "draws public read" on public.draws for select to anon, authenticated using (true);
create policy "draws admin write" on public.draws for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audit admin"     on public.audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Realtime
alter publication supabase_realtime add table public.raffle_numbers, public.orders, public.payments;
