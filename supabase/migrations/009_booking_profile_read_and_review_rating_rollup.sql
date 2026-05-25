drop policy if exists "Booking participants can read related profiles" on public.profiles;
create policy "Booking participants can read related profiles"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.bookings booking
    join public.professional_profiles professional on professional.id = booking.professional_id
    where (booking.customer_id = auth.uid() and professional.user_id = profiles.id)
       or (professional.user_id = auth.uid() and booking.customer_id = profiles.id)
  )
);

create or replace function public.update_professional_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professional_profiles professional
  set average_rating = review_stats.average_rating,
      review_count = review_stats.review_count
  from (
    select professional_id,
           round(avg(rating)::numeric, 2) as average_rating,
           count(*)::integer as review_count
    from public.reviews
    where professional_id = new.professional_id
      and is_reported = false
    group by professional_id
  ) review_stats
  where professional.id = review_stats.professional_id;

  return new;
end;
$$;

drop trigger if exists reviews_update_professional_rating on public.reviews;
create trigger reviews_update_professional_rating
after insert or update on public.reviews
for each row execute function public.update_professional_rating();
