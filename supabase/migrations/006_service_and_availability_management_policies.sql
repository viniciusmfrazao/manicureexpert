drop policy if exists "Professionals can delete own portfolio photos" on public.professional_portfolio_photos;
create policy "Professionals can delete own portfolio photos"
on public.professional_portfolio_photos
for delete
using (
  exists (
    select 1
    from public.professional_profiles professional
    where professional.id = professional_portfolio_photos.professional_id
      and professional.user_id = auth.uid()
  )
);

drop policy if exists "Professionals can read own inactive services" on public.professional_services;
create policy "Professionals can read own inactive services"
on public.professional_services
for select
using (
  exists (
    select 1
    from public.professional_profiles professional
    where professional.id = professional_services.professional_id
      and professional.user_id = auth.uid()
  )
);

drop policy if exists "Professionals can delete own services" on public.professional_services;
create policy "Professionals can delete own services"
on public.professional_services
for delete
using (
  exists (
    select 1
    from public.professional_profiles professional
    where professional.id = professional_services.professional_id
      and professional.user_id = auth.uid()
  )
);

drop policy if exists "Professionals can read own availability" on public.availability_slots;
create policy "Professionals can read own availability"
on public.availability_slots
for select
using (
  exists (
    select 1
    from public.professional_profiles professional
    where professional.id = availability_slots.professional_id
      and professional.user_id = auth.uid()
  )
);

drop policy if exists "Professionals can delete own availability" on public.availability_slots;
create policy "Professionals can delete own availability"
on public.availability_slots
for delete
using (
  exists (
    select 1
    from public.professional_profiles professional
    where professional.id = availability_slots.professional_id
      and professional.user_id = auth.uid()
  )
);
