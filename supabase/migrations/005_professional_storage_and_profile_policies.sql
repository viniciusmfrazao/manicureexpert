insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'professional-portfolio',
  'professional-portfolio',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read portfolio storage" on storage.objects;
create policy "Public can read portfolio storage"
on storage.objects for select
using (bucket_id = 'professional-portfolio');

drop policy if exists "Professionals upload portfolio storage" on storage.objects;
create policy "Professionals upload portfolio storage"
on storage.objects for insert
with check (
  bucket_id = 'professional-portfolio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Professionals update portfolio storage" on storage.objects;
create policy "Professionals update portfolio storage"
on storage.objects for update
using (
  bucket_id = 'professional-portfolio'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'professional-portfolio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Professionals delete portfolio storage" on storage.objects;
create policy "Professionals delete portfolio storage"
on storage.objects for delete
using (
  bucket_id = 'professional-portfolio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Professionals can read their own profile when inactive" on public.professional_profiles;
create policy "Professionals can read their own profile when inactive"
on public.professional_profiles for select
using (auth.uid() = user_id);

drop policy if exists "Professionals read their own portfolio photos" on public.professional_portfolio_photos;
create policy "Professionals read their own portfolio photos"
on public.professional_portfolio_photos for select
using (
  exists (
    select 1
    from public.professional_profiles pp
    where pp.id = professional_portfolio_photos.professional_id
      and pp.user_id = auth.uid()
  )
);
