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
  const captions = [settings.top, settings.bottom].map(text => text.toLocaleUpperCase('bg'));
  if (!captions.some(text => text.trim())) return;
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
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * .14;
  ctx.strokeStyle = '#17131c';
  ctx.fillStyle = settings.color;
  for (const [index, group] of lines.entries()) {
    const start = index === 0 ? inset + step / 2 : height - inset - step * (group.length - .5);
    group.forEach((line, row) => {
      const y = start + row * step;
      ctx.strokeText(line, width / 2, y, width - pad * 2);
      ctx.fillText(line, width / 2, y, width - pad * 2);
    });
  }
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
