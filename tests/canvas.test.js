import assert from 'node:assert/strict';
import test from 'node:test';
import { wrapCaption } from '../src/canvas.js';

const measure = text => [...text].length;
test('wraps Cyrillic captions without losing words', () => {
  assert.deepEqual(wrapCaption('  Много   добро меме  ', 10, measure), ['Много', 'добро меме']);
});
test('breaks long words without splitting Unicode surrogate pairs', () => {
  assert.deepEqual(wrapCaption('🐈🐈🐈🐈🐈', 2, measure), ['🐈🐈', '🐈🐈', '🐈']);
});
test('leaves blank captions empty', () => {
  assert.deepEqual(wrapCaption('  ', 10, measure), []);
});
