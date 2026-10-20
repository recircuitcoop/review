import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTheme } from '../src/theme.js';

function environment({ dark = false, saved = null, blocked = false } = {}) {
  const previous = { window: globalThis.window, document: globalThis.document };
  const root = { dataset: {} }, media = new EventTarget(), button = new EventTarget(), attrs = new Map();
  let preference = saved; media.matches = dark; button.setAttribute = (key, value) => attrs.set(key, value);
  globalThis.document = { documentElement: root };
  globalThis.window = { matchMedia: () => media, localStorage: {
    getItem() { if (blocked) throw new Error('blocked'); return preference; },
    setItem(key, value) { assert.equal(key, 'review-theme'); if (blocked) throw new Error('blocked'); preference = value; }
  } };
  initializeTheme(button);
  return { root, button, attrs, get saved() { return preference; }, system(dark) { media.matches = dark; media.dispatchEvent(new Event('change')); }, click() { button.dispatchEvent(new Event('click')); }, restore() {
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.document === undefined) delete globalThis.document; else globalThis.document = previous.document;
  } };
}
test('theme follows the initial system preference and live changes until manually chosen', () => {
  const e = environment({ dark: true, saved: 'invalid' });
  try { assert.equal(e.root.dataset.theme, 'dark'); assert.equal(e.attrs.get('aria-pressed'), 'true'); e.system(false); assert.equal(e.root.dataset.theme, 'light'); e.click(); assert.equal(e.root.dataset.theme, 'dark'); e.system(false); assert.equal(e.root.dataset.theme, 'dark'); assert.equal(e.saved, 'dark'); }
  finally { e.restore(); }
});
test('a stored manual preference overrides the system and survives reload', () => {
  let e = environment({ dark: false, saved: 'dark' }); let saved;
  try { assert.equal(e.root.dataset.theme, 'dark'); e.click(); saved = e.saved; assert.equal(saved, 'light'); e.system(true); assert.equal(e.root.dataset.theme, 'light'); }
  finally { e.restore(); }
  e = environment({ dark: true, saved }); try { assert.equal(e.root.dataset.theme, 'light'); assert.equal(e.attrs.get('aria-pressed'), 'false'); } finally { e.restore(); }
});
test('restricted storage cannot prevent theme switching or erase the in-page override', () => {
  const e = environment({ blocked: true });
  try { e.click(); assert.equal(e.root.dataset.theme, 'dark'); e.system(false); assert.equal(e.root.dataset.theme, 'dark'); e.click(); assert.equal(e.root.dataset.theme, 'light'); const event = new Event('pointerdown', { cancelable: true }); e.button.dispatchEvent(event); assert.equal(event.defaultPrevented, true); }
  finally { e.restore(); }
});
function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
test('both theme palettes meet text, highlight, control boundary and focus contrast', () => {
  const css = readFileSync(new URL('../src/review.css', import.meta.url), 'utf8');
  for (const selector of [':root', ':root[data-theme="dark"]']) {
    const body = css.slice(css.indexOf(selector)).split('}')[0];
    const colors = Object.fromEntries([...body.matchAll(/--review-([\w-]+):\s*(#[a-f\d]{6})/gi)].map(match => [match[1], match[2]]));
    const pairs = [['text', 'panel'], ['text', 'subtle'], ['text', 'page'], ['muted', 'panel'], ['muted', 'subtle'], ['muted', 'page'], ['text', 'code'], ['link', 'panel'], ['on-primary', 'primary'], ['on-primary', 'primary-hover'], ['left-text', 'left-bg'], ['right-text', 'right-bg'], ['active-text', 'active-bg'], ['mark-left-text', 'mark-left-bg'], ['mark-right-text', 'mark-right-bg'], ['mark-pending-text', 'mark-pending-bg'], ['mark-active-text', 'mark-active-bg']];
    for (const [fg, bg] of pairs.concat([['border', 'panel'], ['border', 'subtle'], ['focus', 'panel'], ['focus', 'page'], ['left-border', 'left-bg'], ['right-border', 'right-bg']])) {
      assert.ok(colors[fg] && colors[bg], `Missing ${selector} colors: ${fg}/${bg}`);
      const a = luminance(colors[fg]), b = luminance(colors[bg]); const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      const minimum = pairs.some(pair => pair[0] === fg && pair[1] === bg) ? 4.5 : 3;
      assert.ok(ratio >= minimum, `${selector} ${fg}/${bg}: ${ratio.toFixed(2)} < ${minimum}`);
    }
  }
});
