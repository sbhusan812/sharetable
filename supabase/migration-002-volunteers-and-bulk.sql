create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('food_verification', 'local_delivery', 'ngo_coordinator')),
  reference text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bulk_listings (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id),
  source_name text not null check (char_length(source_name) between 2 and 120),
  portions integer not null check (portions >= 25),
  ready_by timestamptz not null,
  location_area text not null,
  details text not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'completed', 'expired', 'flagged')),
  ngo_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.volunteer_applications enable row level security;
alter table public.bulk_listings enable row level security;

create policy "applicants can view their applications" on public.volunteer_applications for select using (auth.uid() = applicant_id);
create policy "members can apply to volunteer" on public.volunteer_applications for insert with check (auth.uid() = applicant_id);
create policy "available bulk listings are public" on public.bulk_listings for select using (status = 'available');
create policy "donors can create bulk listings" on public.bulk_listings for insert with check (auth.uid() = donor_id);
create policy "donors can update bulk listings" on public.bulk_listings for update using (auth.uid() = donor_id);
