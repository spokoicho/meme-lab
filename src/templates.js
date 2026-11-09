export const templates = [
  { id: 'cat', name: 'Котка на работа', top: 'Когато тестът мине', bottom: 'от първия път' },
  { id: 'brain', name: 'Мозък в режим турбо', top: 'Имах гениална идея', bottom: 'записах я в грешния чат' },
  { id: 'coffee', name: 'Преди първото кафе', top: 'Сутрешна среща', bottom: 'зареждане…' },
  { id: 'gaming', name: 'Последният живот', top: 'Една бърза игра преди лягане', bottom: 'Добро утро.', format: 'webp' },
  { id: 'exam', name: 'Изненада на изпита', top: 'Учителят: „Само най-важното“', bottom: 'Въпрос 1: бележката под линия', format: 'webp' },
  { id: 'travel', name: 'Багаж за уикенда', top: 'Два дни на море', bottom: 'Багаж за евакуация', format: 'webp' },
  { id: 'dog', name: 'Куче на диета', top: 'Кучето ми е на строга диета', bottom: 'Аз явно съм на изпит за воля', format: 'webp' },
  { id: 'rain', name: 'Прогноза за уикенда', top: '„Вземи слънцезащитен крем“', bottom: 'Слънцето: „Имате грешен номер“', format: 'webp' },
  { id: 'cooking', name: 'Готвач по рецепта', top: '„Печете до златисто“', bottom: 'Аз избрах въгленово', format: 'webp' },
  { id: 'budget', name: 'Портфейл на заплата', top: 'Заплатата влезе в сметката', bottom: 'Мина само да се здрависа', format: 'webp' },
  { id: 'update', name: 'Неочакван ъпдейт', top: 'Имам пет минути', bottom: 'Компютърът: „И аз. От вчера.“', format: 'webp' },
].map(template => ({ ...template, url: './templates/' + template.id + '.' + (template.format ?? 'svg') }));
