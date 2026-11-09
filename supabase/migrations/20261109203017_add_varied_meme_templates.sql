insert into public.templates (id, name) values
  ('gaming', 'Последният живот'),
  ('exam', 'Изненада на изпита'),
  ('travel', 'Багаж за уикенда'),
  ('dog', 'Куче на диета'),
  ('rain', 'Прогноза за уикенда'),
  ('cooking', 'Готвач по рецепта'),
  ('budget', 'Портфейл на заплата'),
  ('update', 'Неочакван ъпдейт')
on conflict (id) do nothing;
