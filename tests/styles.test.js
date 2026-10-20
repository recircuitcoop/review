import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultReviewStyles, resolveReviewStyles } from '../src/styles.js';

test('approved defaults are immutable, complete and resolved independently', () => {
  assert.ok(Object.isFrozen(defaultReviewStyles));
  assert.equal(defaultReviewStyles.background, 'light-dark(#fffefa, #1c201f)');
  assert.equal(defaultReviewStyles.documentFontSize, '16px');
  const first = resolveReviewStyles(), second = resolveReviewStyles();
  assert.deepEqual(first, defaultReviewStyles);
  first.background = 'red';
  assert.notEqual(first.background, second.background);
  assert.equal(defaultReviewStyles.background, second.background);
});

test('partial instance styles copy overrides without mutating options or defaults', () => {
  const overrides = Object.freeze({ background: '#fff8ed', buttonBackground: '#ececec', documentPadding: '32px' });
  const actual = resolveReviewStyles(overrides);
  assert.equal(actual.background, '#fff8ed');
  assert.equal(actual.buttonBackground, '#ececec');
  assert.equal(actual.documentPadding, '32px');
  assert.equal(actual.borderRadius, defaultReviewStyles.borderRadius);
  assert.deepEqual(overrides, { background: '#fff8ed', buttonBackground: '#ececec', documentPadding: '32px' });
});

test('malformed and unknown styles fail explicitly instead of silently falling back', () => {
  for (const value of [null, [], 'dark', 23]) assert.throws(() => resolveReviewStyles(value), /styles must be a map/i);
  assert.throws(() => resolveReviewStyles({ backgound: '#fff' }), /Unknown style: backgound/);
  for (const background of ['', '  ', 123, null, {}]) assert.throws(() => resolveReviewStyles({ background }), /background/);
  for (const value of ['inherit', 'initial', 'unset', 'revert', 'revert-layer']) assert.throws(() => resolveReviewStyles({ background: value }), /reset keyword/);
  assert.equal(resolveReviewStyles({ colorScheme: 'inherit' }).colorScheme, 'inherit');
  assert.throws(() => resolveReviewStyles({ colorScheme: 'invalid-mode' }), /colorScheme/);
});
