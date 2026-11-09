import { $, action, notice } from '../ui/shell.js';
import { supabase } from '../services/client.js';
import { getDownload, getPublicMeme } from '../services/memes.js';
import { downloadBlob } from '../canvas.js';

const id = new URLSearchParams(location.search).get('id');
const unavailable = 'Това меме не е достъпно в публичната галерия.';
const copy = $('#copy-link');
const download = $('#download-meme');

async function show() {
  if (!supabase || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id ?? '')) {
    notice(unavailable);
    return;
  }
  try {
    const meme = await getPublicMeme(id);
    if (!meme) {
      notice(unavailable);
      return;
    }
    const blob = await getDownload(meme.render_path);
    const image = $('#meme-image');
    image.src = URL.createObjectURL(blob);
    image.alt = meme.title;
    try { await image.decode(); }
    finally { URL.revokeObjectURL(image.src); }
    $('#meme-title').textContent = meme.title;
    document.title = meme.title + ' · Meme Lab';
    const url = $('#share-url');
    url.value = new URL('./meme.html?id=' + id, location.href).href;
    copy.onclick = action(copy, async () => {
      try {
        await navigator.clipboard.writeText(url.value);
        notice('Линкът е копиран.');
      } catch {
        url.select();
        notice('Копирай маркирания линк с Ctrl+C или от менюто на телефона.');
      }
    });
    download.onclick = action(download, async () => downloadBlob(blob, meme.title));
    $('#shared-meme').hidden = false;
  } catch {
    notice(unavailable);
  }
}
show();
