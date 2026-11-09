alter table public.memes
  add column caption_layout jsonb,
  add constraint valid_meme_caption_layout check (
    caption_layout is null or case
      when jsonb_typeof(caption_layout) = 'object'
        and jsonb_typeof(caption_layout -> 'layers') = 'array'
      then jsonb_array_length(caption_layout -> 'layers') between 2 and 8
        and octet_length(caption_layout::text) <= 8192
      else false
    end
  );

grant insert (caption_layout), update (caption_layout) on public.memes to authenticated;
