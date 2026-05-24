create extension if not exists postgis;
create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'professional', 'admin');
create type public.booking_status as enum ('requested', 'accepted', 'declined', 'cancelled', 'completed');
create type public.verification_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Casa',
  street text not null,
  number text,
  complement text,
  neighborhood text,
  city text not null,
  state text not null,
  postal_code text,
  latitude double precision not null,
  longitude double precision not null,
  location geography(point, 4326) generated always as (st_setsrid(st_makepoint(longitude, latitude), 4326)::geography) stored,
  created_at timestamptz not null default now()
);

create table public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  bio text,
  base_city text not null,
  base_state text not null,
  base_latitude double precision not null,
  base_longitude double precision not null,
  base_location geography(point, 4326) generated always as (st_setsrid(st_makepoint(base_longitude, base_latitude), 4326)::geography) stored,
  service_radius_km integer not null default 8 check (service_radius_km > 0),
  travel_fee numeric(10, 2) not null default 0 check (travel_fee >= 0),
  is_active boolean not null default false,
  verification_status public.verification_status not null default 'pending',
  average_rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.professional_profiles(id),
  service_id uuid not null references public.professional_services(id),
  address_id uuid not null references public.customer_addresses(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'requested',
  service_price numeric(10, 2) not null check (service_price >= 0),
  travel_fee numeric(10, 2) not null default 0 check (travel_fee >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.professional_profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_reported boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.professional_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  verification_status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  target_user_id uuid references public.profiles(id),
  target_professional_id uuid references public.professional_profiles(id),
  note text not null,
  created_at timestamptz not null default now()
);

create index customer_addresses_location_idx on public.customer_addresses using gist (location);
create index professional_profiles_location_idx on public.professional_profiles using gist (base_location);
create index professional_profiles_active_idx on public.professional_profiles (is_active, verification_status);
create index availability_slots_professional_time_idx on public.availability_slots (professional_id, starts_at, ends_at);
create index bookings_customer_idx on public.bookings (customer_id, starts_at desc);
create index bookings_professional_idx on public.bookings (professional_id, starts_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger professional_profiles_set_updated_at before update on public.professional_profiles for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

create or replace function public.find_active_professionals(customer_latitude double precision, customer_longitude double precision, max_distance_km integer default 20)
returns table (professional_id uuid, user_id uuid, full_name text, avatar_url text, bio text, distance_km numeric, average_rating numeric, review_count integer, travel_fee numeric)
language sql stable as $$
  with customer_point as (
    select st_setsrid(st_makepoint(customer_longitude, customer_latitude), 4326)::geography as location
  )
  select pp.id, pp.user_id, p.full_name, p.avatar_url, pp.bio,
    round((st_distance(pp.base_location, cp.location) / 1000)::numeric, 2) as distance_km,
    pp.average_rating, pp.review_count, pp.travel_fee
  from public.professional_profiles pp
  join public.profiles p on p.id = pp.user_id
  cross join customer_point cp
  where pp.is_active = true
    and pp.verification_status = 'approved'
    and st_dwithin(pp.base_location, cp.location, max_distance_km * 1000)
    and st_distance(pp.base_location, cp.location) <= pp.service_radius_km * 1000
  order by st_distance(pp.base_location, cp.location), pp.average_rating desc;
$$;

alter table public.profiles enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_services enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.professional_documents enable row level security;
alter table public.admin_notes enable row level security;

create policy "Users can read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Customers manage their addresses" on public.customer_addresses for all using (auth.uid() = customer_id) with check (auth.uid() = customer_id);
create policy "Public can read active approved professionals" on public.professional_profiles for select using (is_active = true and verification_status = 'approved');
create policy "Professionals manage their own profile" on public.professional_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public can read active services" on public.professional_services for select using (is_active = true);
create policy "Professionals manage their services" on public.professional_services for all using (exists (select 1 from public.professional_profiles pp where pp.id = professional_services.professional_id and pp.user_id = auth.uid())) with check (exists (select 1 from public.professional_profiles pp where pp.id = professional_services.professional_id and pp.user_id = auth.uid()));
create policy "Professionals manage availability" on public.availability_slots for all using (exists (select 1 from public.professional_profiles pp where pp.id = availability_slots.professional_id and pp.user_id = auth.uid())) with check (exists (select 1 from public.professional_profiles pp where pp.id = availability_slots.professional_id and pp.user_id = auth.uid()));
create policy "Customers and professionals read their bookings" on public.bookings for select using (auth.uid() = customer_id or exists (select 1 from public.professional_profiles pp where pp.id = bookings.professional_id and pp.user_id = auth.uid()));
create policy "Customers create bookings" on public.bookings for insert with check (auth.uid() = customer_id);
create policy "Customers and professionals update their bookings" on public.bookings for update using (auth.uid() = customer_id or exists (select 1 from public.professional_profiles pp where pp.id = bookings.professional_id and pp.user_id = auth.uid()));
create policy "Public can read reviews" on public.reviews for select using (true);
create policy "Customers create reviews for their bookings" on public.reviews for insert with check (auth.uid() = customer_id);
create policy "Professionals manage their documents" on public.professional_documents for all using (exists (select 1 from public.professional_profiles pp where pp.id = professional_documents.professional_id and pp.user_id = auth.uid())) with check (exists (select 1 from public.professional_profiles pp where pp.id = professional_documents.professional_id and pp.user_id = auth.uid()));
