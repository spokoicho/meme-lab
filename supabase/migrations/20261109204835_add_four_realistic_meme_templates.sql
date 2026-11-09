insert into public.templates (id, name) values
  ('meeting', 'Среща без край'),
  ('traffic', 'Задръстване по график'),
  ('fitness', 'Фитнес за начинаещи'),
  ('parcel', 'Пратка с изненада')
on conflict (id) do nothing;
