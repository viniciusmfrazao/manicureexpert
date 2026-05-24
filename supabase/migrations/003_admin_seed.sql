update public.profiles
set role = 'admin'
where id in (
  select id
  from auth.users
  where email = 'viniciusmfrazao@gmail.com'
);
