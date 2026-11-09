export const templates = [
  { id: 'cat', name: 'Котка на работа', top: 'Когато тестът мине', bottom: 'от първия път' },
  { id: 'brain', name: 'Мозък в режим турбо', top: 'Имах гениална идея', bottom: 'записах я в грешния чат' },
  { id: 'coffee', name: 'Преди първото кафе', top: 'Сутрешна среща', bottom: 'зареждане…' },
].map(template => ({ ...template, url: './templates/' + template.id + '.svg' }));
