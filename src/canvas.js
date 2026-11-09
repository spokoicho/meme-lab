import { captionDefaults } from './captions.js';

export function wrapCaption(text, maxWidth, measure) {
  const lines = [];
  let line = '';
  for (const word of text.trim().split(/\s+/u).filter(Boolean)) {
    const joined = line ? line + ' ' + word : word;
    if (measure(joined) <= maxWidth) {
      line = joined;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    for (const letter of word) {
      if (line && measure(line + letter) > maxWidth) {
        lines.push(line);
        line = '';
      }
      line += letter;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function loadImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

export function drawMeme(canvas, image, settings) {
  const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  ctx.drawImage(image, 0, 0, width, height);
  const pad = width * .05;
  const style = { ...captionDefaults, ...settings };
  const layers = settings.layers ?? [{ text: settings.top }, { text: settings.bottom }];
  const captions = layers.map(layer => layer.text.toLocaleUpperCase('bg'));
  if (!captions.some(text => text.trim())) return [];
  let size = Math.max(1, settings.size * width / 600);
  let lines;
  while (true) {
    ctx.font = '900 ' + size + 'px Arial, sans-serif';
    lines = captions.map(text => wrapCaption(text, width - pad * 2, value => ctx.measureText(value).width));
    if (lines.flat().length * size * 1.12 <= height * .9 || size <= .5) break;
    size *= .85;
  }
  const step = size * 1.12;
  const inset = Math.min(height * .05, pad);
  ctx.textAlign = style.align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (style.thickness) ctx.lineWidth = size * style.thickness / 100;
  ctx.strokeStyle = style.outline;
  ctx.fillStyle = settings.color;
  if (style.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, .8)';
    ctx.shadowBlur = size * .12;
    ctx.shadowOffsetY = size * .09;
  }
  const bounds = [];
  for (const [index, group] of lines.entries()) {
    if (!group.length) continue;
    const halfWidth = Math.min(width - pad * 2, Math.max(...group.map(line => ctx.measureText(line).width))) / 2;
    const halfHeight = step * group.length / 2;
    const defaultY = index === 0 ? inset + halfHeight
      : index === 1 ? height - inset - halfHeight
        : height * (.35 + ((index - 2) % 5) * .075);
    const x = Math.max(halfWidth, Math.min(width - halfWidth, (layers[index].x ?? .5) * width));
    const y = Math.max(halfHeight, Math.min(height - halfHeight, layers[index].y == null ? defaultY : layers[index].y * height));
    const anchor = style.align === 'left' ? x - halfWidth : style.align === 'right' ? x + halfWidth : x;
    group.forEach((line, row) => {
      const baseline = y - halfHeight + (row + .5) * step;
      if (style.thickness) ctx.strokeText(line, anchor, baseline, width - pad * 2);
      ctx.fillText(line, anchor, baseline, width - pad * 2);
    });
    bounds.push({ index, x, y, halfWidth, halfHeight });
  }
  return bounds;
}

export function pngBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('PNG файлът не можа да се създаде.')),
    'image/png',
  ));
}

export function downloadBlob(blob, title) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (title.trim() || 'meme') + '.png';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
