drop policy if exists "Public can read available professional slots" on public.availability_slots;
create policy "Public can read available professional slots"
on public.availability_slots
for select
using (
  is_available = true
  and exists (
    select 1
    from public.professional_profiles professional
    where professional.id = availability_slots.professional_id
      and professional.is_active = true
      and professional.verification_status = 'approved'
  )
);
