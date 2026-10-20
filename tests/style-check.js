import { mountReview, defaultReviewStyles } from '../src/review.js';

const options = {
  document: { id: 'styles.md', version: 'v1', markdown: '# Notes\n\nA selectable **passage**.' },
  labels: [{ id: 'a', name: 'Accept', direction: 'left' }, { id: 'b', name: 'Reject', direction: 'right' }],
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const equal = (actual, expected) => assert(JSON.stringify(actual) === JSON.stringify(expected), `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
const fixtures = document.querySelector('#fixtures');
const results = [];
async function check(name, run) {
  try { await run(); results.push(`PASS ${name}`); }
  catch (error) { results.push(`FAIL ${name}: ${error.message}`); }
  document.querySelector('#results').textContent = results.join('\n');
}
function mount(styles) {
  const container = document.createElement('div'); fixtures.append(container);
  const review = mountReview(container, { ...options, styles });
  return { container, review, root: container.querySelector('.review'), destroy() { review.destroy(); container.remove(); } };
}

await check('instance background, typography, spacing, borders and buttons are independent of host and peers', () => {
  const sentinel = document.querySelector('#host-sentinel');
  const before = [getComputedStyle(sentinel).color, getComputedStyle(sentinel).fontSize, document.documentElement.getAttribute('style')];
  const styles = { colorScheme: 'light', background: '#fff8ed', textColor: '#24392d', fontFamily: 'monospace', documentFontSize: '19px', documentPadding: '31px', borderRadius: '17px', borderWidth: '3px', buttonBackground: '#e0dfdc', buttonTextColor: '#123456', buttonPadding: '10px', primaryBackground: '#123456', primaryTextColor: '#ffffff' };
  const first = mount(styles), second = mount({ colorScheme: 'dark' });
  try {
    const a = getComputedStyle(first.root), b = getComputedStyle(second.root);
    equal(a.backgroundColor, 'rgb(255, 248, 237)'); equal(b.backgroundColor, 'rgb(28, 32, 31)');
    equal(a.borderTopWidth, '3px'); equal(a.borderRadius, '17px'); assert(a.fontFamily.includes('monospace'), 'UI font override ignored');
    const text = getComputedStyle(first.root.querySelector('.review-document')); equal(text.fontSize, '19px'); equal(text.paddingTop, '31px');
    const button = getComputedStyle(first.root.querySelector('[data-command="undo"]')); equal(button.backgroundColor, 'rgb(224, 223, 220)'); equal(button.color, 'rgb(18, 52, 86)'); equal(button.paddingTop, '10px');
    equal(getComputedStyle(first.root.querySelector('[data-command="finish"]')).backgroundColor, 'rgb(18, 52, 86)');
    styles.background = 'red'; equal(getComputedStyle(first.root).backgroundColor, 'rgb(255, 248, 237)');
    equal([getComputedStyle(sentinel).color, getComputedStyle(sentinel).fontSize, document.documentElement.getAttribute('style')], before);
    equal(second.root.style.getPropertyValue('--review-panel'), defaultReviewStyles.background);
  } finally { first.destroy(); second.destroy(); }
});
await check('approved defaults follow instance/host appearance while styles leave anchors and exports unchanged', () => {
  const first = mount({ colorScheme: 'light' }), second = mount({ colorScheme: 'dark', documentFontSize: '24px', documentPadding: '50px' });
  try {
    equal(getComputedStyle(first.root).backgroundColor, 'rgb(255, 254, 250)');
    equal(getComputedStyle(first.root.querySelector('.review-document')).fontSize, '16px');
    equal(first.review.export().document, second.review.export().document);
    first.review.select(6, 16); second.review.select(6, 16);
    first.root.querySelector('[data-command="left"]').click(); second.root.querySelector('[data-command="left"]').click();
    const a = first.review.read()[0], b = second.review.read()[0]; equal([a.start, a.end, a.quote, a.labelId], [b.start, b.end, b.quote, b.labelId]);
  } finally { first.destroy(); second.destroy(); }
});
await check('instance highlight and dialog styling survive selection, history and destruction', async () => {
  const host = document.createElement('div'), original = document.createElement('span'); original.textContent = 'Original host content'; host.append(original); fixtures.append(host);
  const review = mountReview(host, { ...options, styles: { colorScheme: 'light', background: '#fff8ed', highlightLeftBackground: '#ddffee', dialogPadding: '30px', dialogRadius: '18px' } });
  try {
    const root = host.querySelector('.review'); review.select(6, 16); root.querySelector('[data-command="left"]').click();
    const before = review.export(); review.undo(); equal(review.read(), []); review.redo(); equal(review.export(), before);
    equal(getComputedStyle(root.querySelector('.review-document')).getPropertyValue('--review-mark-left-bg').trim(), '#ddffee');
    assert(root.querySelector('style').textContent.includes('var(--review-mark-left-bg'), 'Highlight bypasses instance variable');
    root.querySelector('[data-command="help"]').click(); const dialog = root.querySelector('dialog');
    equal(getComputedStyle(dialog).backgroundColor, 'rgb(255, 248, 237)'); equal(getComputedStyle(dialog).paddingTop, '30px'); equal(getComputedStyle(dialog).borderRadius, '18px');
    const closed = new Promise(resolve => dialog.addEventListener('close', resolve, { once: true })); dialog.close(); await closed;
  } finally { review.destroy(); assert(host.firstChild === original && host.childNodes.length === 1, 'Destroy did not restore original nodes'); host.remove(); }
});
await check('invalid CSS and unknown style names reject before replacing host content', () => {
  for (const styles of [{ background: 'not-a-color' }, { documentFontSize: '-4px' }, { borderWidth: 'thick nonsense' }, { unknown: 'red' }, { colorScheme: 'invalid-mode' }]) {
    const host = document.createElement('div'), original = document.createElement('span'); host.append(original); fixtures.append(host);
    try {
      let rejected = false;
      try { mountReview(host, { ...options, styles }); } catch { rejected = true; }
      assert(rejected, `Accepted invalid styles ${JSON.stringify(styles)}`); assert(host.firstChild === original && host.childNodes.length === 1, 'Invalid mount changed host nodes');
    } finally { host.remove(); }
  }
});
const failed = results.filter(result => result.startsWith('FAIL')).length;
document.querySelector('#summary').textContent = `${failed ? 'FAIL' : 'PASS'}: ${results.length - failed}/${results.length} style checks`;
document.title = document.querySelector('#summary').textContent;
