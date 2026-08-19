create extension if not exists "pgcrypto";

create type public.user_role as enum ('member', 'ngo', 'volunteer', 'admin');
create type public.listing_status as enum ('available', 'reserved', 'completed', 'expired', 'flagged');
create type public.handoff_method as enum ('owner_delivers', 'receiver_collects', 'volunteer_helps');
create type public.verification_result as enum ('confirmed', 'quantity_mismatch', 'unsafe', 'unable_to_verify');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.user_role not null default 'member',
  phone_verified boolean not null default false,
  identity_verified boolean not null default false,
  organization_name text,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 3 and 120),
  food_type text not null,
  portions integer not null check (portions > 0),
  pickup_by timestamptz not null,
  handoff_method public.handoff_method not null,
  status public.listing_status not null default 'available',
  location_area text not null,
  details text,
  photo_path text,
  verified_portions integer,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  receiver_id uuid not null references public.profiles(id),
  volunteer_id uuid references public.profiles(id),
  status text not null default 'requested' check (status in ('requested', 'accepted', 'picked_up', 'delivered', 'cancelled')),
  pickup_confirmed_at timestamptz,
  receiver_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  verifier_id uuid not null references public.profiles(id),
  actual_portions integer check (actual_portions > 0),
  result public.verification_result not null,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id),
  volunteer_id uuid not null references public.profiles(id),
  pickup_proof_path text,
  delivery_proof_path text,
  recipient_confirmed boolean not null default false,
  hours numeric(5,2) check (hours >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.support_contributions (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid references public.profiles(id),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'INR',
  frequency text not null default 'once' check (frequency in ('once', 'monthly')),
  provider_reference text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.claims enable row level security;
alter table public.verification_records enable row level security;
alter table public.volunteer_tasks enable row level security;
alter table public.support_contributions enable row level security;

create policy "available listings are public" on public.listings for select using (status = 'available');
create policy "members can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "members can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "donors can create listings" on public.listings for insert with check (auth.uid() = donor_id);
create policy "donors can update their listings" on public.listings for update using (auth.uid() = donor_id);
create policy "users can view their claims" on public.claims for select using (auth.uid() = receiver_id or auth.uid() = volunteer_id);
create policy "receivers can create claims" on public.claims for insert with check (auth.uid() = receiver_id);
create policy "verifiers can view verification records" on public.verification_records for select using (auth.uid() = verifier_id);
create policy "verified volunteers can view their tasks" on public.volunteer_tasks for select using (auth.uid() = volunteer_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'New member'));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
