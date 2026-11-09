insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meme-files', 'meme-files', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']);

create policy "Upload into own meme folder" on storage.objects for insert to authenticated
with check (
  bucket_id = 'meme-files' and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/(meme[.]png|source[.](png|jpg|webp))$'
);

create policy "Read own files and visible rendered memes" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'meme-files' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.memes where render_path = storage.objects.name)
  )
);

create policy "Delete unreferenced own meme files" on storage.objects for delete to authenticated
using (
  bucket_id = 'meme-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1 from public.memes where render_path = storage.objects.name or source_path = storage.objects.name
  )
);

create function public.require_meme_files() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from storage.objects where bucket_id = 'meme-files' and name = new.render_path
  ) or (new.source_path is not null and not exists (
    select 1 from storage.objects where bucket_id = 'meme-files' and name = new.source_path
  )) then
    raise exception 'Upload files before saving a meme' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.require_meme_files() from public, anon, authenticated;
create trigger check_meme_files before insert or update of source_path, render_path on public.memes
for each row execute function public.require_meme_files();
