import { $, action, notice, userReady } from '../ui/shell.js';
import { supabase } from '../services/client.js';
import { getDownload, getMeme, saveMeme } from '../services/memes.js';
import { downloadBlob, drawMeme, loadImage, pngBlob } from '../canvas.js';
import { supportedImage } from '../image-file.js';
import { templates } from '../templates.js';
import { restoreCaptions, MAX_CAPTIONS } from '../captions.js';
import { createCaptionEditor } from '../ui/caption-editor.js';

const form = $('#editor');
const canvas = $('#canvas');
const picker = $('#template');
const save = $('#save');
const download = $('#download');
const fileInput = $('#upload');
const params = new URLSearchParams(location.search);
const editId = params.get('id');
let image;
let source;
let selectedTemplate;
let saving = false;
let previous;
let user;
let selection = 0;
let loading = false;
const info = $('#cloud-info');
const addCaption = $('#add-caption');
const captions = createCaptionEditor(canvas, $('#captions'), addCaption, render);
const settings = () => ({
  layers: captions.layers,
  size: Number($('#size').value),
  color: $('#color').value,
  outline: $('#outline').value,
  thickness: Number($('#thickness').value),
  shadow: $('#shadow').checked,
  align: $('#align').value,
});
function loadCaptions(layout, top, bottom) {
  const restored = restoreCaptions(layout, top, bottom);
  captions.load(restored);
  $('#outline').value = restored.outline;
  $('#thickness').value = restored.thickness;
  $('#shadow').checked = restored.shadow;
  $('#align').value = restored.align;
}
function render() {
  if (image) captions.updateBounds(drawMeme(canvas, image, settings()));
}
function refreshButtons() {
  download.disabled = loading || !image;
  save.disabled = saving || loading || !image || !user || Boolean(editId && !previous);
}
async function selectImage(url, templateId, file = null) {
  const request = ++selection;
  loading = true;
  refreshButtons();
  try {
    const decoded = await loadImage(url);
    if (request !== selection) return false;
    image = decoded;
    source = file;
    selectedTemplate = templateId;
    render();
    return true;
  } catch (error) {
    if (request === selection) throw error;
  } finally {
    if (request === selection) {
      loading = false;
      refreshButtons();
    }
  }
}
async function selectFile(file) {
  const request = ++selection;
  loading = true;
  refreshButtons();
  let normalized;
  try {
    normalized = await supportedImage(file);
  } catch (error) {
    if (request !== selection) return false;
    loading = false;
    refreshButtons();
    throw error;
  }
  if (request !== selection) return false;
  const url = URL.createObjectURL(normalized);
  try { return await selectImage(url, null, normalized); }
  finally { URL.revokeObjectURL(url); }
}

for (const template of templates) picker.add(new Option(template.name, template.id));
const initial = templates.find(template => template.id === params.get('template')) ?? templates[0];
picker.value = initial.id;
const remix = params.get('remix') === '1';
loadCaptions(null, remix ? '' : initial.top, remix ? '' : initial.bottom);
for (const control of ['#size', '#color', '#outline', '#thickness', '#shadow', '#align']) {
  $(control).addEventListener('input', render);
}

picker.addEventListener('change', async () => {
  if (!picker.value) return;
  notice('');
  try {
    const template = templates.find(item => item.id === picker.value);
    if (await selectImage(template.url, template.id)) {
      picker.querySelector('[value=""]')?.remove();
      fileInput.value = '';
    }
  } catch (error) {
    picker.value = selectedTemplate ?? '';
    notice(error.message, true);
  }
});
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  notice('');
  try {
    if (await selectFile(file)) {
      if (!picker.querySelector('[value=""]')) picker.add(new Option('Качено изображение', ''));
      picker.value = '';
    }
  } catch (error) {
    fileInput.value = '';
    notice(error instanceof DOMException ? 'Изображението не може да се отвори.' : error.message, true);
  }
});
download.onclick = action(download, async () => downloadBlob(await pngBlob(canvas), $('#title').value));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!user || saving || loading || !image || (editId && !previous)) return;
  saving = true;
  refreshButtons();
  notice('');
  const values = settings();
  const sourceFile = source;
  const data = {
    title: $('#title').value.trim() || 'Без заглавие',
    template_id: selectedTemplate,
    top_text: values.layers[0].text, bottom_text: values.layers[1].text,
    font_size: values.size, text_color: values.color,
    caption_layout: restoreCaptions(values),
    is_public: $('#public').checked,
  };
  try {
    const { saved, cleanupFailed } = await saveMeme({
      owner: user.id, previous, data, source: sourceFile, png: await pngBlob(canvas),
    });
    previous = saved;
    history.replaceState(null, '', './editor.html?id=' + saved.id);
    notice(cleanupFailed ? 'Мемето е запазено. Старите файлове изискват почистване.' : 'Мемето е запазено.');
  } catch (error) { notice(error.message, true); }
  finally {
    saving = false;
    refreshButtons();
  }
});

async function initialize() {
  const controls = [...form.elements];
  controls.forEach(control => { control.disabled = true; });
  try {
    user = await userReady;
    if (editId) {
      if (!user) throw new Error('Влез в профила си, за да редактираш запазено меме.');
      previous = await getMeme(editId, user.id);
      $('#title').value = previous.title;
      loadCaptions(previous.caption_layout, previous.top_text, previous.bottom_text);
      $('#size').value = previous.font_size;
      $('#color').value = previous.text_color;
      $('#public').checked = previous.is_public;
      if (previous.source_path) {
        picker.add(new Option('Качено изображение', ''));
        picker.value = '';
        await selectFile(await getDownload(previous.source_path));
      } else {
        const template = templates.find(item => item.id === previous.template_id);
        picker.value = template.id;
        await selectImage(template.url, template.id);
      }
    } else {
      await selectImage(initial.url, initial.id);
    }
  } catch (error) {
    previous = null;
    notice(error.message, true);
  } finally {
    controls.forEach(control => { control.disabled = false; });
    info.textContent = user ? 'Можеш да запазиш мемето само за себе си или да го публикуваш.'
      : supabase ? 'Влез в профила си за запазване в облака.' : 'Можеш да създаваш и сваляш мемета. Запазването в профил изисква свързване със Supabase.';
    $('#public').disabled = !user;
    addCaption.disabled = captions.layers.length >= MAX_CAPTIONS;
    refreshButtons();
  }
}
initialize();
