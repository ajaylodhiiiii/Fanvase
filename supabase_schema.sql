-- ============================================================
-- FANVASE DATABASE SCHEMA (Supabase / PostgreSQL)
-- Run this whole file in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to re-run (idempotent where possible).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  display_name text,
  avatar_url text,
  country text,
  bio text,
  role text not null default 'fan' check (role in ('fan','creator','admin')),
  is_creator boolean not null default false,
  referral_code text,
  referred_by uuid references public.profiles(id),
  platform_plan text check (platform_plan in ('basic','pro')),
  platform_status text not null default 'inactive' check (platform_status in ('inactive','pending','active')),
  created_at timestamptz not null default now()
);

-- ---------- COMMUNITIES ----------
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  cover_url text,
  category text,
  country text,
  pricing_type text not null default 'recurring' check (pricing_type in ('recurring','onetime')),
  billing_period text default 'monthly' check (billing_period in ('monthly','yearly')),
  price numeric not null default 0,
  currency text not null default 'USD',
  payment_link text,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists communities_creator_idx on public.communities(creator_id);
create index if not exists communities_category_idx on public.communities(category);

-- ---------- POSTS ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  content text,
  type text not null default 'text' check (type in ('text','image','file','link')),
  media_url text,
  link_url text,
  visibility text not null default 'members' check (visibility in ('public','members','premium')),
  status text not null default 'published' check (status in ('draft','published','scheduled')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists posts_community_idx on public.posts(community_id);

-- ---------- MEMBERSHIPS ----------
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text,
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  joined_at timestamptz not null default now(),
  expires_at timestamptz,
  added_by uuid references public.profiles(id),
  unique (community_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists memberships_community_idx on public.memberships(community_id);

-- ---------- TRANSACTIONS ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  community_id uuid references public.communities(id) on delete set null,
  amount numeric not null default 0,
  currency text not null default 'USD',
  type text not null check (type in ('subscription','onetime','referral','payout','platform')),
  status text not null default 'completed' check (status in ('pending','completed','failed')),
  description text,
  created_at timestamptz not null default now()
);
create index if not exists tx_creator_idx on public.transactions(creator_id);

-- ---------- REFERRALS ----------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','converted','paid')),
  reward numeric not null default 10,
  created_at timestamptz not null default now()
);
create table if not exists public.referral_clicks (
  id uuid primary key default gen_random_uuid(),
  referral_code text,
  created_at timestamptz not null default now()
);

-- ---------- CREATOR BALANCES ----------
create table if not exists public.creator_balances (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  available numeric not null default 0,
  pending numeric not null default 0,
  total_earned numeric not null default 0,
  referral_earned numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- PAYOUTS ----------
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','processing','paid')),
  created_at timestamptz not null default now()
);

-- ---------- NOTIFICATIONS ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text,
  title text,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- All application data access happens server-side via the service role
-- (which bypasses RLS) with explicit authorization checks in code.
-- We enable RLS so anon/public keys cannot read/write directly.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.posts enable row level security;
alter table public.memberships enable row level security;
alter table public.transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_clicks enable row level security;
alter table public.creator_balances enable row level security;
alter table public.payouts enable row level security;
alter table public.notifications enable row level security;

-- Optional: allow authenticated users to read their own profile directly.
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('media','media', true, 10485760),
  ('files','files', true, 2097152)
on conflict (id) do nothing;

-- Allow public read + authenticated write on our buckets (MVP).
drop policy if exists "fanvase media read" on storage.objects;
create policy "fanvase media read" on storage.objects
  for select using (bucket_id in ('media','files'));

drop policy if exists "fanvase media write" on storage.objects;
create policy "fanvase media write" on storage.objects
  for insert to authenticated with check (bucket_id in ('media','files'));

-- Done. Fanvase schema ready.
