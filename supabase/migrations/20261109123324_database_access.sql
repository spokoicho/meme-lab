alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.templates enable row level security;
alter table public.memes enable row level security;

revoke all on public.profiles, public.user_roles, public.templates, public.memes from public, anon, authenticated;
grant select on public.profiles, public.user_roles to authenticated;
grant select on public.templates, public.memes to anon, authenticated;
grant insert (id, user_id, template_id, source_path, render_path, title, top_text, bottom_text, font_size, text_color, is_public) on public.memes to authenticated;
grant update (template_id, source_path, render_path, title, top_text, bottom_text, font_size, text_color, is_public) on public.memes to authenticated;
grant delete on public.memes to authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create policy "Read own profile or administer" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Read own role or administer" on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Read templates" on public.templates for select to anon, authenticated using (true);

create policy "Read gallery, own or moderated memes" on public.memes for select to anon, authenticated
using ((is_public and not is_hidden) or user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Create own memes" on public.memes for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "Update own memes" on public.memes for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own memes" on public.memes for delete to authenticated
using (user_id = (select auth.uid()));

create function public.set_meme_hidden(meme_id uuid, hidden boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  update public.memes set is_hidden = hidden where id = meme_id;
  if not found then
    raise exception 'Meme not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.set_meme_hidden(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_meme_hidden(uuid, boolean) to authenticated;
