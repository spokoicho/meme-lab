import { $, action, notice, userReady } from '../ui/shell.js';
import { supabase } from '../services/client.js';
import { getDownload, getMeme, saveMeme } from '../services/memes.js';
import { downloadBlob, drawMeme, loadImage, pngBlob } from '../canvas.js';
import { supportedImage } from '../image-file.js';
import { templates } from '../templates.js';
import { restoreCaptions, MAX_CAPTIONS } from '../captions.js';
import { createCaptionEditor } from '../ui/caption-editor.js';
import { clearDraft, draftKey, readDraft, writeDraft } from '../drafts.js';

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
let selectedTemplateUrl;
let saving = false;
let previous;
let user;
let selection = 0;
let loading = false;
let localDraftKey;
let pendingDraft;
let draftTimer;
let draftDirty = false;
let cloudSource;
let awaitingImage = false;
const info = $('#cloud-info');
const addCaption = $('#add-caption');
const captionStyle = () => ({
  size: Number($('#size').value),
  color: $('#color').value,
  outline: $('#outline').value,
  thickness: Number($('#thickness').value),
  shadow: $('#shadow').checked,
});
const captions = createCaptionEditor(canvas, $('#captions'), addCaption, changed, captionStyle);
const settings = () => ({ ...captionStyle(), layers: captions.layers, align: $('#align').value });
function templateUrlForLayout(template, layout) {
  return template.format === 'webp' && !layout?.templatePhoto
    ? './templates/' + template.id + '.svg'
    : template.url;
}
function captionLayout(values) {
  return { ...restoreCaptions(values), templatePhoto: Boolean(selectedTemplateUrl?.endsWith('.webp')) };
}
function snapshotDraft() {
  const values = settings();
  return {
    title: $('#title').value,
    size: values.size,
    color: values.color,
    layout: captionLayout(values),
    isPublic: $('#public').checked,
    templateId: selectedTemplate,
    needsUpload: awaitingImage || Boolean(source && source !== cloudSource),
  };
}
function flushDraft() {
  clearTimeout(draftTimer);
  if (!localDraftKey || !draftDirty || pendingDraft) return;
  writeDraft(localDraftKey, snapshotDraft());
}
function changed() {
  render();
  draftDirty = true;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(flushDraft, 250);
}
window.addEventListener('pagehide', flushDraft);

$('#discard-draft').addEventListener('click', () => {
  clearDraft(localDraftKey);
  pendingDraft = null;
  $('#draft-offer').hidden = true;
  flushDraft();
});
$('#restore-draft').addEventListener('click', action($('#restore-draft'), async () => {
  const draft = pendingDraft;
  if (!draft) return;
  const template = templates.find(item => item.id === draft.templateId);
  const templateUrl = template && templateUrlForLayout(template, draft.layout);
  if (template && selectedTemplateUrl !== templateUrl) {
    if (!await selectImage(templateUrl, template.id)) return;
    picker.querySelector('[value=""]')?.remove();
    picker.value = template.id;
    fileInput.value = '';
  }
  if (draft.needsUpload) {
    image = undefined;
    source = undefined;
    selectedTemplate = null;
    selectedTemplateUrl = undefined;
    awaitingImage = true;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    captions.updateBounds([]);
    if (!picker.querySelector('[value=""]')) picker.add(new Option('Избери изображение', ''));
    picker.value = '';
    fileInput.value = '';
  }
  $('#title').value = draft.title ?? '';
  $('#size').value = draft.size ?? 52;
  $('#color').value = draft.color ?? '#ffffff';
  $('#public').checked = Boolean(user && draft.isPublic);
  loadCaptions(draft.layout);
  pendingDraft = null;
  $('#draft-offer').hidden = true;
  refreshButtons();
  changed();
  notice(draft.needsUpload ? 'Черновата е възстановена. Качи отново снимката или избери шаблон.'
    : 'Черновата е възстановена.');
}));

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
    selectedTemplateUrl = templateId ? url : undefined;
    awaitingImage = false;
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
for (const control of ['#size', '#color', '#outline', '#thickness', '#shadow', '#align', '#title', '#public']) {
  $(control).addEventListener('input', changed);
}

picker.addEventListener('change', async () => {
  if (!picker.value) return;
  notice('');
  try {
    const template = templates.find(item => item.id === picker.value);
    if (await selectImage(template.url, template.id)) {
      picker.querySelector('[value=""]')?.remove();
      fileInput.value = '';
      changed();
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
      changed();
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
  const beforeSave = JSON.stringify(snapshotDraft());
  const data = {
    title: $('#title').value.trim() || 'Без заглавие',
    template_id: selectedTemplate,
    top_text: values.layers[0].text, bottom_text: values.layers[1].text,
    font_size: values.size, text_color: values.color,
    caption_layout: captionLayout(values),
    is_public: $('#public').checked,
  };
  try {
    const { saved, cleanupFailed } = await saveMeme({
      owner: user.id, previous, data, source: sourceFile, png: await pngBlob(canvas),
    });
    previous = saved;
    const changedDuringSave = JSON.stringify(snapshotDraft()) !== beforeSave || source !== sourceFile;
    clearTimeout(draftTimer);
    clearDraft(localDraftKey);
    localDraftKey = draftKey(user.id, saved.id);
    cloudSource = sourceFile;
    pendingDraft = null;
    $('#draft-offer').hidden = true;
    draftDirty = changedDuringSave;
    flushDraft();
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
        cloudSource = source;
      } else {
        const template = templates.find(item => item.id === previous.template_id);
        picker.value = template.id;
        await selectImage(templateUrlForLayout(template, previous.caption_layout), template.id);
      }
    } else {
      await selectImage(initial.url, initial.id);
    }
    localDraftKey = draftKey(user?.id ?? 'guest', editId ?? (initial.id + (remix ? ':remix' : '')));
    pendingDraft = readDraft(localDraftKey);
    if (pendingDraft) {
      $('#draft-message').textContent = pendingDraft.needsUpload
        ? 'Има локална чернова. За възстановяване на качената снимка ще трябва да я избереш отново.'
        : 'Има локална чернова за това меме.';
      $('#draft-offer').hidden = false;
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
