import assert from 'node:assert/strict';
import test from 'node:test';
import { drawMeme } from '../src/canvas.js';
import { restoreCaptions } from '../src/captions.js';

function preview() {
  const strokes = [];
  const fills = [];
  const context = {
    drawImage() {},
    measureText: value => ({ width: value.length * 12 }),
    strokeText: (...args) => strokes.push(args),
    fillText: (...args) => fills.push(args),
  };
  return { canvas: { getContext: () => context }, context, strokes, fills };
}
const image = { naturalWidth: 600, naturalHeight: 400 };

test('restores legacy captions and preserves their top and bottom placement', () => {
  const { canvas, strokes, fills } = preview();
  const layout = restoreCaptions(null, 'Горе', 'Долу');
  const bounds = drawMeme(canvas, image, { ...layout, size: 50, color: '#ffffff' });
  assert.deepEqual(bounds.map(({ x, y }) => [x, Math.round(y)]), [[300, 48], [300, 352]]);
  assert.deepEqual(strokes, fills);
});

test('draws a saved extra caption in its position with alignment and no outline', () => {
  const { canvas, context, strokes, fills } = preview();
  const layout = restoreCaptions({
    layers: [{ text: '' }, { text: '' }, { text: 'Трети', x: .25, y: .6 }],
    align: 'right',
    thickness: 0,
    shadow: true,
  });
  const bounds = drawMeme(canvas, image, { ...layout, size: 50, color: '#ffffff' });
  assert.equal(context.textAlign, 'right');
  assert.ok(context.shadowBlur > 0);
  assert.deepEqual(strokes, []);
  assert.deepEqual(fills, [['ТРЕТИ', 180, 240, 540]]);
  assert.deepEqual(bounds.map(({ index, x, y }) => [index, x, y]), [[2, 150, 240]]);
});

test('restores and renders separate caption styles without changing the shared style', () => {
  const { canvas, context } = preview();
  const styles = [];
  context.fillText = text => styles.push([text, context.font, context.fillStyle, context.strokeStyle, context.shadowBlur > 0]);
  const layout = restoreCaptions(JSON.parse(JSON.stringify({
    layers: [
      { text: 'Горе' },
      { text: 'Долу', style: { size: 32, color: '#ffff00', outline: '#0000ff', thickness: 8, shadow: true } },
    ],
  })));
  drawMeme(canvas, image, { ...layout, size: 50, color: '#ffffff' });
  assert.deepEqual(styles, [
    ['ГОРЕ', '900 50px Arial, sans-serif', '#ffffff', '#17131c', false],
    ['ДОЛУ', '900 32px Arial, sans-serif', '#ffff00', '#0000ff', true],
  ]);
});
