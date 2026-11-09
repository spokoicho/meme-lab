insert into public.templates (id, name) values
  ('parking', 'Паркиране по усет'),
  ('donkeys', 'Две магарета, един план'),
  ('please', 'Айде де… Не.'),
  ('overthinking', 'Мисли в три сутринта'),
  ('judgecat', 'Котката те съди')
on conflict (id) do nothing;
