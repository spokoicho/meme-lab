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
  const defaults = { ...captionDefaults, ...settings };
  const layers = settings.layers ?? [{ text: settings.top }, { text: settings.bottom }];
  const captions = layers.map(layer => layer.text.toLocaleUpperCase('bg'));
  if (!captions.some(text => text.trim())) return [];
  let fit = 1;
  let groups;
  do {
    groups = captions.map((text, index) => {
      const style = { ...defaults, ...Object.fromEntries(
        Object.entries(layers[index].style ?? {}).filter(([, value]) => value != null),
      ) };
      const size = Math.max(.5, style.size * width / 600 * fit);
      ctx.font = '900 ' + size + 'px Arial, sans-serif';
      const lines = wrapCaption(text, width - pad * 2, value => ctx.measureText(value).width);
      return { lines, style, size, font: ctx.font };
    });
    if (groups.reduce((height, group) => height + group.lines.length * group.size * 1.12, 0) <= height * .9) break;
    fit *= .85;
  } while (fit > .001);

  const inset = Math.min(height * .05, pad);
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const bounds = [];
  for (const [index, { lines: group, style, size, font }] of groups.entries()) {
    if (!group.length) continue;
    const step = size * 1.12;
    ctx.font = font;
    ctx.textAlign = style.align;
    if (style.thickness) ctx.lineWidth = size * style.thickness / 100;
    ctx.strokeStyle = style.outline;
    ctx.fillStyle = style.color;
    ctx.shadowColor = style.shadow ? 'rgba(0, 0, 0, .8)' : 'transparent';
    ctx.shadowBlur = style.shadow ? size * .12 : 0;
    ctx.shadowOffsetY = style.shadow ? size * .09 : 0;
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
