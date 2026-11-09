import { $ } from '../ui/shell.js';
import { templates } from '../templates.js';

for (const template of templates) {
  const card = document.createElement('article');
  card.className = 'tile';
  const image = new Image();
  image.src = template.url;
  image.alt = template.name;
  const link = document.createElement('a');
  link.className = 'tile-body d-block';
  link.href = './editor.html?template=' + template.id;
  link.textContent = template.name + ' ↗';
  card.append(image, link);
  $('#templates').append(card);
}
