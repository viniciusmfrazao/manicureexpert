create table if not exists public.professional_portfolio_photos (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  image_url text not null,
  title text,
  description text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists professional_portfolio_photos_professional_idx
  on public.professional_portfolio_photos (professional_id, sort_order, created_at desc);

alter table public.professional_portfolio_photos enable row level security;

drop policy if exists "Public can read professional portfolio photos"
on public.professional_portfolio_photos;

create policy "Public can read professional portfolio photos"
on public.professional_portfolio_photos for select
using (
  exists (
    select 1
    from public.professional_profiles pp
    where pp.id = professional_portfolio_photos.professional_id
      and pp.is_active = true
      and pp.verification_status = 'approved'
  )
);

drop policy if exists "Professionals manage their portfolio photos"
on public.professional_portfolio_photos;

create policy "Professionals manage their portfolio photos"
on public.professional_portfolio_photos for all
using (
  exists (
    select 1
    from public.professional_profiles pp
    where pp.id = professional_portfolio_photos.professional_id
      and pp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.professional_profiles pp
    where pp.id = professional_portfolio_photos.professional_id
      and pp.user_id = auth.uid()
  )
);
