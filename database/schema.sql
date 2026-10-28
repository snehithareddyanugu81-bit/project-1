-- BloodLink database schema for Supabase PostgreSQL
-- Run this file once in Supabase Dashboard -> SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(80) not null check (char_length(trim(full_name)) between 2 and 80),
  blood_group varchar(3) not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  city varchar(80) not null check (char_length(trim(city)) between 1 and 80),
  area varchar(100),
  phone varchar(20) not null unique check (char_length(trim(phone)) between 7 and 20),
  email varchar(254),
  available boolean not null default true,
  consent_to_listing boolean not null default false check (consent_to_listing = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name varchar(80) not null check (char_length(trim(requester_name)) between 2 and 80),
  blood_group varchar(3) not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_needed integer not null check (units_needed between 1 and 20),
  city varchar(80) not null,
  hospital varchar(140) not null,
  phone varchar(20) not null check (char_length(trim(phone)) between 7 and 20),
  needed_by timestamptz not null,
  details varchar(500),
  status varchar(20) not null default 'open' check (status in ('open','fulfilled','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donors_blood_city_idx on public.donors (blood_group, lower(city));
create index if not exists donors_available_idx on public.donors (available) where available = true;
create index if not exists requests_status_created_idx on public.emergency_requests (status, created_at desc);
create index if not exists requests_blood_city_idx on public.emergency_requests (blood_group, lower(city));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists donors_set_updated_at on public.donors;
create trigger donors_set_updated_at before update on public.donors
for each row execute function public.set_updated_at();

drop trigger if exists requests_set_updated_at on public.emergency_requests;
create trigger requests_set_updated_at before update on public.emergency_requests
for each row execute function public.set_updated_at();

-- This MVP accesses the database through the Express backend using a server-only
-- Supabase secret key. Keep these tables private from browser clients.
alter table public.donors enable row level security;
alter table public.emergency_requests enable row level security;

-- Intentionally no anon/authenticated policies are created. Browser requests go
-- through Express, which validates input and uses the server-only key. Never put
-- the secret key in frontend files or commit it to Git.
