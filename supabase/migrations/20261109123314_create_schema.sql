create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin'))
);

create table public.templates (
  id text primary key,
  name text not null
);

insert into public.templates (id, name) values
  ('cat', 'Котка на работа'),
  ('brain', 'Мозък в режим турбо'),
  ('coffee', 'Преди първото кафе');

create table public.memes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id text references public.templates(id),
  source_path text unique,
  render_path text not null unique,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  top_text text not null default '' check (char_length(top_text) <= 140),
  bottom_text text not null default '' check (char_length(bottom_text) <= 140),
  font_size int not null default 52 check (font_size between 24 and 92),
  text_color text not null default '#ffffff' check (text_color ~ '^#[0-9a-fA-F]{6}$'),
  is_public boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint meme_has_one_source check ((template_id is null) <> (source_path is null)),
  constraint render_path_matches_meme check (
    render_path ~ ('^' || user_id || '/' || id || '/[0-9a-f-]{36}/meme[.]png$')
  ),
  constraint source_path_matches_revision check (
    source_path is null or (
      split_part(source_path, '/', 1) = user_id::text and
      split_part(source_path, '/', 2) = id::text and
      split_part(source_path, '/', 3) = split_part(render_path, '/', 3) and
      split_part(source_path, '/', 4) ~ '^source[.](png|jpg|webp)$' and
      split_part(source_path, '/', 5) = ''
    )
  )
);

create index memes_by_owner on public.memes (user_id, created_at desc);
create index memes_in_gallery on public.memes (created_at desc) where is_public and not is_hidden;
create index memes_by_template on public.memes (template_id);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id);
  insert into public.user_roles(user_id) values (new.id);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger create_meme_profile after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles(id) select id from auth.users on conflict do nothing;
insert into public.user_roles(user_id) select id from public.profiles on conflict do nothing;
