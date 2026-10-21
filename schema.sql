-- Run this in Supabase Dashboard > SQL Editor.
create table if not exists public.login_events (
  id bigint generated always as identity primary key,
  provider text not null check (provider = 'snapchat'),
  provider_user_id text not null,
  display_name text,
  status text not null check (status = 'success'),
  logged_in_at timestamptz not null default now()
);

-- This table is written by the server using the service-role key.
-- Keep RLS enabled and do not grant public/anon/authenticated access.
alter table public.login_events enable row level security;

revoke all on table public.login_events from anon, authenticated;
