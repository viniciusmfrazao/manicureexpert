drop policy if exists "Professionals can read booked customer addresses" on public.customer_addresses;
create policy "Professionals can read booked customer addresses"
on public.customer_addresses
for select
using (
  exists (
    select 1
    from public.bookings booking
    join public.professional_profiles professional on professional.id = booking.professional_id
    where booking.address_id = customer_addresses.id
      and professional.user_id = auth.uid()
  )
);
