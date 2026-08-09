create or replace function public.admin_list_users()
returns table (id uuid, email text, created_at timestamptz)
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
    select u.id, u.email::text, u.created_at
    from auth.users u
    order by u.created_at asc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated, service_role;

create or replace function public.admin_set_user_admin(_user_id uuid, _is_admin boolean)
returns void
language plpgsql
volatile
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

  if _user_id = auth.uid() and _is_admin = false then
    raise exception 'You cannot remove your own admin access';
  end if;

  if not exists (select 1 from auth.users u where u.id = _user_id) then
    raise exception 'User not found';
  end if;

  if _is_admin then
    insert into public.user_roles (user_id, role)
    values (_user_id, 'admin')
    on conflict (user_id, role) do nothing;
  else
    delete from public.user_roles
    where user_id = _user_id and role = 'admin';
  end if;
end;
$$;

revoke all on function public.admin_set_user_admin(uuid, boolean) from public;
grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated, service_role;