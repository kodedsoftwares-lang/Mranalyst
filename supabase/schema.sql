-- Mr Analyst — Supabase schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/vmldoamgogbxnpnhtstz/sql

-- ─────────────────────────────────────────────
-- TIPS
-- ─────────────────────────────────────────────
create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('pro_plus', 'pro')),
  teams text,
  tip_type text,
  odds numeric(6,2),
  status text not null default 'locked'
    check (status in ('locked', 'pending', 'won', 'lost', 'postponed', 'cancelled')),
  match_date date,
  match_time time,
  publish_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tips enable row level security;

-- Public read (all users see the list, but sensitive fields are masked in the API layer)
create policy "tips_select_all" on public.tips
  for select using (true);

-- Only service role can write
create policy "tips_insert_service" on public.tips
  for insert with check (auth.role() = 'service_role');

create policy "tips_update_service" on public.tips
  for update using (auth.role() = 'service_role');

create policy "tips_delete_service" on public.tips
  for delete using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- LIVE MESSAGES
-- ─────────────────────────────────────────────
create table if not exists public.live_messages (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  user_city text,
  message text not null,
  tier text not null check (tier in ('pro_plus', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.live_messages enable row level security;

create policy "live_messages_select_all" on public.live_messages
  for select using (true);

create policy "live_messages_insert_service" on public.live_messages
  for insert with check (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- VIP USERS
-- ─────────────────────────────────────────────
create table if not exists public.vip_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  tier text not null check (tier in ('pro_plus', 'pro')),
  auth_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.vip_users enable row level security;

create policy "vip_users_service_all" on public.vip_users
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- VIP ACCESS CODES
-- ─────────────────────────────────────────────
create table if not exists public.vip_access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  tier text not null check (tier in ('pro_plus', 'pro')),
  is_active boolean not null default true,
  max_uses int,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.vip_access_codes enable row level security;

create policy "vip_codes_service_all" on public.vip_access_codes
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- APP CONFIG
-- ─────────────────────────────────────────────
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy "app_config_select_all" on public.app_config
  for select using (true);

create policy "app_config_write_service" on public.app_config
  for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- SCHEDULED POSTS
-- ─────────────────────────────────────────────
create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  tier text not null check (tier in ('pro_plus', 'pro')),
  publish_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'published', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.scheduled_posts enable row level security;

create policy "scheduled_posts_service_all" on public.scheduled_posts
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- SEED: SAMPLE DATA
-- ─────────────────────────────────────────────
insert into public.tips (tier, teams, tip_type, odds, status, match_date, match_time) values
  ('pro_plus', 'Manchester City vs Arsenal', 'Both Teams to Score', 1.85, 'won', current_date, '15:00'),
  ('pro_plus', 'Real Madrid vs Barcelona', 'Over 2.5 Goals', 1.72, 'won', current_date - 1, '21:00'),
  ('pro_plus', 'Bayern Munich vs Dortmund', '1X2 — Home Win', 1.55, 'lost', current_date - 1, '18:30'),
  ('pro_plus', null, null, null, 'locked', current_date, '20:45'),
  ('pro_plus', null, null, null, 'locked', current_date, '18:00'),
  ('pro', 'Liverpool vs Chelsea', 'Double Chance — 1X', 1.45, 'won', current_date, '17:30'),
  ('pro', 'PSG vs Monaco', 'Over 1.5 Goals', 1.38, 'pending', current_date, '19:00'),
  ('pro', null, null, null, 'locked', current_date, '21:00'),
  ('pro', 'Atletico Madrid vs Sevilla', 'Draw No Bet — Home', 1.60, 'won', current_date - 2, '20:00'),
  ('pro', 'Inter Milan vs Napoli', 'Over 2.5 Goals', 1.80, 'lost', current_date - 2, '18:00')
on conflict do nothing;

insert into public.vip_access_codes (code, tier, is_active) values
  ('MRPRO2025', 'pro', true),
  ('MRPLUSVIP', 'pro_plus', true)
on conflict do nothing;

insert into public.app_config (key, value, description) values
  ('pro_plus_price', '$419', 'Price shown for Pro Plus VIP plan'),
  ('pro_price', '$219', 'Price shown for Pro VIP plan'),
  ('support_email', 'support@mranalyst.com', 'Support contact email'),
  ('min_odds', '1.30', 'Minimum odds threshold'),
  ('live_chat_enabled', 'true', 'Whether live chat is enabled')
on conflict do nothing;
