import { supabase } from './client.js';

const fields = 'id,user_id,title,template_id,source_path,render_path,top_text,bottom_text,font_size,text_color,is_public,is_hidden,created_at';
const files = () => supabase.storage.from('meme-files');

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function listMemes(scope, owner) {
  let query = supabase.from('memes').select(fields).order('created_at', { ascending: false }).limit(60);
  if (scope === 'gallery') query = query.eq('is_public', true).eq('is_hidden', false);
  if (scope === 'collection') query = query.eq('user_id', owner);
  return unwrap(await query);
}
export async function getMeme(id, owner) {
  return unwrap(await supabase.from('memes').select(fields + ',caption_layout').eq('id', id).eq('user_id', owner).single());
}
export async function getDownload(path) {
  return unwrap(await files().download(path));
}
export async function previews(rows) {
  if (!rows.length) return new Map();
  const data = unwrap(await files().createSignedUrls(rows.map(row => row.render_path), 900));
  return new Map(data.map(item => [item.path, item.signedUrl]));
}

export async function saveMeme({ owner, previous, data, source, png }) {
  const id = previous?.id ?? crypto.randomUUID();
  const prefix = owner + '/' + id + '/' + crypto.randomUUID() + '/';
  const renderPath = prefix + 'meme.png';
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const sourcePath = source ? prefix + 'source.' + ext[source.type] : null;
  const uploaded = [];
  let saved;
  try {
    if (source) {
      unwrap(await files().upload(sourcePath, source));
      uploaded.push(sourcePath);
    }
    unwrap(await files().upload(renderPath, png));
    uploaded.push(renderPath);
    const row = { ...data, source_path: sourcePath, render_path: renderPath };
    const query = previous
      ? supabase.from('memes').update(row).eq('id', id).eq('render_path', previous.render_path)
      : supabase.from('memes').insert({ ...row, id, user_id: owner });
    saved = unwrap(await query.select(fields).single());
  } catch (error) {
    if (uploaded.length) await files().remove(uploaded);
    throw error;
  }
  const cleanupFailed = previous ? await cleanup(previous) : false;
  return { saved, cleanupFailed };
}

async function cleanup(row) {
  const { error } = await files().remove([row.render_path, row.source_path].filter(Boolean));
  return Boolean(error);
}
export async function deleteMeme(row) {
  unwrap(await supabase.from('memes').delete().eq('id', row.id).eq('render_path', row.render_path).select('id').single());
  return cleanup(row);
}
export async function moderate(row) {
  return unwrap(await supabase.rpc('set_meme_hidden', { meme_id: row.id, hidden: !row.is_hidden }));
}

export async function getPublicMeme(id) {
  return unwrap(await supabase.from('memes')
    .select('title,render_path')
    .eq('id', id)
    .eq('is_public', true)
    .eq('is_hidden', false)
    .maybeSingle());
}
