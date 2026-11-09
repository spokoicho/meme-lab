import { $, action, notice } from './shell.js';
import { deleteMeme, getDownload, listMemes, moderate, previews } from '../services/memes.js';
import { downloadBlob, drawMeme, loadImage, pngBlob } from '../canvas.js';
import { templates } from '../templates.js';

function empty(message) {
  const element = document.createElement('p');
  element.className = 'empty';
  element.textContent = message;
  $('#listing').replaceChildren(element);
}

function button(label, task) {
  const control = document.createElement('button');
  control.className = 'button secondary';
  control.textContent = label;
  control.onclick = action(control, task);
  return control;
}

function card(title, url, status) {
  const tile = document.createElement('article');
  tile.className = 'tile';
  const body = document.createElement('div');
  body.className = 'tile-body';
  const heading = document.createElement('h2');
  heading.textContent = title;
  if (url) {
    const image = new Image();
    image.src = url;
    image.alt = title;
    image.loading = 'lazy';
    tile.append(image);
  }
  body.append(heading);
  if (status) {
    const caption = document.createElement('div');
    caption.className = 'muted';
    caption.textContent = status;
    body.append(caption);
  }
  const actions = document.createElement('div');
  actions.className = 'actions';
  body.append(actions);
  tile.append(body);
  return { tile, actions };
}

export async function demoGallery() {
  const cards = await Promise.all(templates.map(async template => {
    const canvas = document.createElement('canvas');
    const image = await loadImage(template.url);
    drawMeme(canvas, image, { ...template, size: 45, color: '#ffffff' });
    const { tile, actions } = card(template.name, canvas.toDataURL('image/png'), 'Примерно меме');
    actions.append(button('↓ PNG', async () => downloadBlob(await pngBlob(canvas), template.name)));
    return tile;
  }));
  $('#listing').replaceChildren(...cards);
}

export async function showMemes(scope, owner) {
  try {
    const rows = await listMemes(scope, owner);
    if (!rows.length) {
      empty(scope === 'collection' ? 'Тук ще се появят запазените ти мемета.' : 'Все още няма мемета за показване.');
      return;
    }
    const urls = await previews(rows);
    const cards = rows.map(row => {
      const status = row.is_hidden ? 'Скрито от модератор' : row.is_public ? 'Публично' : 'Лично';
      const { tile, actions } = card(row.title, urls.get(row.render_path), scope === 'gallery' ? null : status);
      actions.append(button('↓ PNG', async () => downloadBlob(await getDownload(row.render_path), row.title)));
      if (scope === 'collection') {
        const edit = document.createElement('a');
        edit.href = './editor.html?id=' + row.id;
        edit.textContent = 'Редактирай';
        edit.className = 'button secondary';
        actions.append(edit, button('Изтрий', async () => {
          if (!confirm('Да изтрия ли това меме?')) return;
          const cleanupFailed = await deleteMeme(row);
          await showMemes(scope, owner);
          if (cleanupFailed) notice('Мемето е изтрито. Файловете му изискват почистване.', true);
        }));
      }
      if (scope === 'admin' && (row.is_public || row.is_hidden)) {
        actions.append(button(row.is_hidden ? 'Възстанови' : 'Скрий', async () => {
          await moderate(row);
          await showMemes(scope, owner);
        }));
      }
      return tile;
    });
    $('#listing').replaceChildren(...cards);
  } catch (error) { notice(error.message, true); }
}
