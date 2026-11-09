create schema meme_private;
revoke all on schema meme_private from public;
grant usage on schema meme_private to anon, authenticated;

alter function public.handle_new_user() set schema meme_private;
alter function public.require_meme_files() set schema meme_private;
alter function public.is_admin() set schema meme_private;
alter function public.set_meme_hidden(uuid, boolean) set schema meme_private;

create function public.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
  select meme_private.is_admin();
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

create function public.set_meme_hidden(meme_id uuid, hidden boolean) returns void
language sql security invoker set search_path = '' as $$
  select meme_private.set_meme_hidden(meme_id, hidden);
$$;
revoke all on function public.set_meme_hidden(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_meme_hidden(uuid, boolean) to authenticated;

create or replace function meme_private.set_meme_hidden(meme_id uuid, hidden boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not meme_private.is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  update public.memes set is_hidden = hidden where id = meme_id;
  if not found then
    raise exception 'Meme not found' using errcode = 'P0002';
  end if;
end;
$$;
