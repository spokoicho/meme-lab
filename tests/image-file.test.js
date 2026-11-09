import assert from 'node:assert/strict';
import test from 'node:test';
import { supportedImage } from '../src/image-file.js';

test('recognizes a PNG even when a browser does not supply the MIME type', async () => {
  const file = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])]);
  assert.equal((await supportedImage(file)).type, 'image/png');
});
test('rejects unsupported bytes even when labeled as a PNG', async () => {
  await assert.rejects(supportedImage(new Blob(['text'], { type: 'image/png' })), /валидно/);
});
