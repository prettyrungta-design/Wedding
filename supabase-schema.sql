-- Run this entire script in Supabase Dashboard > SQL Editor.
create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 100),
  phone text not null check (char_length(phone) between 5 and 20),
  family_name text,
  attendance text not null check (attendance in ('yes','no','maybe')),
  adults integer not null default 0 check (adults between 0 and 30),
  children integer not null default 0 check (children between 0 and 30),
  events text[] not null default '{}',
  dietary text,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now()
);

alter table public.wedding_rsvps enable row level security;

-- Guests can submit an RSVP but cannot read the guest list.
drop policy if exists "Anyone can submit RSVP" on public.wedding_rsvps;
create policy "Anyone can submit RSVP"
  on public.wedding_rsvps for insert
  to anon, authenticated
  with check (true);

-- Only authenticated admins can view and manage responses.
drop policy if exists "Admins can view RSVPs" on public.wedding_rsvps;
create policy "Admins can view RSVPs"
  on public.wedding_rsvps for select
  to authenticated
  using (true);

drop policy if exists "Admins can update RSVPs" on public.wedding_rsvps;
create policy "Admins can update RSVPs"
  on public.wedding_rsvps for update
  to authenticated
  using (true)
  with check (true);

-- No public update/delete policies are created.
