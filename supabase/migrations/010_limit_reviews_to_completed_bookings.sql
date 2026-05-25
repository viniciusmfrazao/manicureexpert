drop policy if exists "Customers create reviews for their bookings" on public.reviews;
create policy "Customers create reviews for completed bookings"
on public.reviews
for insert
with check (
  auth.uid() = customer_id
  and exists (
    select 1
    from public.bookings booking
    where booking.id = reviews.booking_id
      and booking.customer_id = auth.uid()
      and booking.professional_id = reviews.professional_id
      and booking.status = 'completed'
  )
);
