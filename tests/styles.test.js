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

// Light and dark halves of each `light-dark(#light, #dark)` default.
function palette(index) {
  const colors = {};
  for (const [name, value] of Object.entries(defaultReviewStyles)) {
    const match = value.match(/^light-dark\((#[a-f\d]{6}),\s*(#[a-f\d]{6})\)$/i);
    if (match) colors[name] = match[index + 1];
  }
  return colors;
}
function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

test('default widget text on navbar, whisper, keycap, label and highlight surfaces meets AA in light and night', () => {
  const pairs = [
    ['textColor', 'background'], ['textColor', 'surfaceBackground'], ['textColor', 'toolbarBackground'],
    ['mutedColor', 'background'], ['mutedColor', 'surfaceBackground'], ['mutedColor', 'toolbarBackground'],
    ['linkColor', 'background'], ['primaryTextColor', 'primaryBackground'], ['buttonTextColor', 'buttonHoverBackground'],
    ['leftTextColor', 'leftBackground'], ['rightTextColor', 'rightBackground'], ['leftTextColor', 'background'], ['rightTextColor', 'background'],
    ['activeTextColor', 'activeBackground'], ['highlightLeftTextColor', 'highlightLeftBackground'], ['highlightRightTextColor', 'highlightRightBackground'],
    ['highlightPendingTextColor', 'highlightPendingBackground'], ['highlightActiveTextColor', 'highlightActiveBackground'],
  ];
  for (const [index, theme] of [[0, 'light'], [1, 'night']]) {
    const colors = palette(index);
    for (const [fg, bg] of pairs) {
      assert.ok(colors[fg] && colors[bg], `Missing ${theme} ${fg}/${bg}`);
      const a = luminance(colors[fg]), b = luminance(colors[bg]);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      assert.ok(ratio >= 4.5, `${theme} ${fg}/${bg}: ${ratio.toFixed(2)} < 4.5`);
    }
  }
});

test('every public style token has a consumer in the widget styles or highlights', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../src/review.css', import.meta.url), 'utf8') + readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
  const source = readFileSync(new URL('../src/styles.js', import.meta.url), 'utf8');
  for (const [, variable] of source.matchAll(/\[\s*'(--review-[\w-]+)'/g)) {
    assert.ok(css.includes(`var(${variable})`), `${variable} has no consumer`);
  }
});
