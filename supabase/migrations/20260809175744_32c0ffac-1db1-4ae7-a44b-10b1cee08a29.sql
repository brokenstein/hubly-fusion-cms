drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (id uuid, email text, created_at timestamptz, is_admin boolean)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ) then
    raise exception 'Forbidden: admin access required';
  end if;

  return query
    select
      u.id,
      u.email::text,
      u.created_at,
      exists (
        select 1 from public.user_roles ur
        where ur.user_id = u.id and ur.role = 'admin'
      ) as is_admin
    from auth.users u
    order by u.created_at asc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated, service_role;