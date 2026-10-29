import { mountReview } from '../src/review.js';
import { canonicalText } from '../src/text.js';

const results = [];
const labels = [{ id: 'left', name: 'Accept', direction: 'left' }, { id: 'right', name: 'Reject', direction: 'right' }];
const options = { document: { id: 'check.md', version: 'v1', markdown: '# Hi\n\nOne **two** and [link](https://example.org).\n\nNext 🌍 世界.\n\n- Item one\n- Item two\n\n```js\n  code\n```' }, labels };
const equal = (actual, expected, message = 'Values differ') => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`); };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function mount(extra = {}) {
  const container = document.createElement('div'); document.querySelector('#fixtures').append(container);
  return { container, review: mountReview(container, { ...options, ...extra }) };
}
const click = (container, name) => { const button = container.querySelector(`[data-command="${name}"]`); button.focus(); button.click(); };
const key = (target, key, modifiers = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers }));
const pointerClick = target => {
  const rect = target.getBoundingClientRect();
  const init = { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: rect.left + 3, clientY: rect.top + 3 };
  target.dispatchEvent(new PointerEvent('pointerdown', init));
  target.dispatchEvent(new PointerEvent('pointerup', init));
};
// Simulate both platform sources; userAgentData undefined exercises the navigator.platform fallback.
function simulatePlatform(platform, userAgentPlatform) {
  Object.defineProperty(navigator, 'platform', { configurable: true, value: platform });
  Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: userAgentPlatform === undefined ? undefined : { platform: userAgentPlatform } });
}
// The real values live on Navigator.prototype, so deleting the own overrides restores them.
function restorePlatform() { delete navigator.platform; delete navigator.userAgentData; }
async function check(name, run) {
  try { await run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
  document.querySelector('#results').textContent = results.map(r => `${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.error ? '\n  ' + r.error : ''}`).join('\n');
}

await check('Canonical profile preserves exact rendered text, block separators, lists, and code whitespace', () => {
  const { container, review } = mount();
  equal(review.export().document.text, 'Hi\nOne two and link.\nNext 🌍 世界.\nItem one\nItem two\n  code\n');
  review.destroy(); container.remove();
});
await check('Click selects tight, loose, and nested list items; selection alone never commits', () => {
  const { container, review } = mount({ document: { ...options.document, markdown: '- Tight **item**\n- Other\n\n1. Loose paragraph\n\n   Second paragraph\n\n2. Parent\n   - Nested item' } });
  try {
    const surface = container.querySelector('.review-document');
    pointerClick(surface.querySelector('li strong')); click(container, 'left'); equal(review.read()[0].quote, 'Tight item');
    const loose = [...surface.querySelectorAll('li')].find(li => li.textContent.includes('Loose paragraph'));
    pointerClick(loose.querySelector('p')); equal(review.read().length, 1); click(container, 'left');
    assert(review.read().some(a => a.quote.includes('Loose paragraph\nSecond paragraph')), 'Whole loose item was not selected');
    const nested = [...surface.querySelectorAll('li')].find(li => li.textContent.trim() === 'Nested item');
    pointerClick(nested); click(container, 'right'); assert(review.read().some(a => a.quote === 'Nested item'), 'Nested click selected its parent');
    const navigation = [];
    for (let i = 0; i < 5; i++) { click(container, 'nextBlock'); navigation.push(document.activeElement); }
    assert(navigation.every(node => node.tagName === 'LI'), 'Duplicate stops inside list items');
  } finally { review.destroy(); container.remove(); }
});
await check('Code block click/keyboard selection preserve whitespace and exact partial drags stay partial', () => {
  const { container, review } = mount({ document: { ...options.document, markdown: '```js\n  const answer = 42;\n\n  print(answer);\n```' } });
  try {
    const code = container.querySelector('.review-document code'); const expected = code.textContent;
    pointerClick(code); equal(review.read().length, 0); click(container, 'left'); equal(review.read()[0].quote, expected);
    const pre = code.parentElement; pre.focus(); key(pre, 'Enter'); click(container, 'right'); equal(review.read()[1].quote, expected);
    const range = document.createRange(); range.setStart(code.firstChild, 2); range.setEnd(code.firstChild, 7);
    getSelection().removeAllRanges(); getSelection().addRange(range); document.dispatchEvent(new Event('selectionchange'));
    click(container, 'left'); assert(review.read().some(a => a.quote === 'const'), 'Precise code range expanded to the entire block');
  } finally { review.destroy(); container.remove(); }
});
await check('DOM ranges round-trip every textual position including emoji, inline markup, and cross-block ranges', () => {
  const { container, review } = mount(); const surface = container.querySelector('.review-document'); const map = canonicalText(surface);
  for (const [start, end] of [[0, 2], [3, 10], [7, 10], [3, 29], [25, 27], [31, 39]]) equal(map.fromRange(map.range(start, end)), { start, end });
  review.destroy(); container.remove();
});
await check('All supported Markdown elements survive; XSS and remote images do not', () => {
  const { container, review } = mount({ document: { ...options.document, markdown: '# Heading\n\n*em* **strong** [safe](https://example.org)\n\n> quote\n\n- item\n\n```js\ncode\n```\n\n<script>window.attacked=true</script><img src="https://example.org/track" onerror="window.attacked=true"><a href="javascript:alert(1)" onclick="alert(1)">bad</a><iframe src="https://example.org"></iframe>' } });
  for (const tag of ['h1', 'em', 'strong', 'a', 'blockquote', 'ul', 'li', 'pre', 'code']) assert(container.querySelector('.review-document ' + tag), `Missing ${tag}`);
  assert(!container.querySelector('.review-document script,.review-document img,.review-document iframe,.review-document [onclick],.review-document [href^="javascript:"]'), 'Unsafe DOM survived');
  assert(!window.attacked, 'Injected code executed'); review.destroy(); container.remove();
});
await check('Pending ranges do not export or enter history; buttons commit once and emit copied events', () => {
  const { container, review } = mount(); let creates = 0;
  container.addEventListener('review:create', event => { creates++; event.detail.quote = 'tampered'; });
  review.select(3, 10); equal(review.read(), []); equal(review.export().selections.left, []);
  click(container, 'left'); click(container, 'left');
  equal(creates, 1); equal(review.read()[0].quote, 'One two');
  review.destroy(); container.remove();
});
await check('Native cross-format selection survives toolbar focus and commits exact canonical text', async () => {
  const { container, review } = mount(); const p = container.querySelector('.review-document p');
  const range = document.createRange(); range.setStart(p.firstChild, 1); range.setEnd(p.querySelector('strong').firstChild, 2);
  getSelection().removeAllRanges(); getSelection().addRange(range); document.dispatchEvent(new Event('selectionchange'));
  container.querySelector('[data-command="left"]').focus(); click(container, 'left');
  equal(review.read()[0].quote, 'ne tw'); await tick(); equal(review.read().length, 1);
  review.destroy(); container.remove();
});
await check('Relabel/delete/history keep overlapping annotation identities and highlights consistent', () => {
  const { container, review } = mount(); review.select(3, 10); click(container, 'left'); const first = review.read()[0];
  review.select(4, 13); click(container, 'right'); const second = review.read()[1];
  review.activate(first.id); review.relabel(first.id, 'right'); review.delete(second.id);
  review.undo(); review.undo(); equal(review.read().map(a => a.labelId), ['left', 'right']);
  review.redo(); equal(review.read().map(a => a.labelId), ['right', 'right']);
  assert(container.querySelectorAll('.review-saved-item').length === 2, 'Saved list differs from state');
  review.destroy(); container.remove();
});
await check('Restore rejects mismatched anchors atomically and grouped/split round-trips preserve identity', () => {
  const { container, review } = mount(); review.select(3, 10); click(container, 'left');
  const before = review.export(); const bad = structuredClone(before); bad.selections.left[0].quote = 'wrong';
  let rejected = false; try { review.restore(bad); } catch { rejected = true; }
  assert(rejected, 'Invalid restore accepted'); equal(review.export(), before);
  review.restore(review.export('split')); equal(review.export(), before);
  review.destroy(); container.remove();
});
await check('Reflow and font changes preserve text positions and annotation IDs', () => {
  const { container, review } = mount(); review.select(3, 29); click(container, 'right'); const before = review.export();
  container.style.width = '320px'; container.style.fontSize = '24px';
  equal(review.export(), before); review.destroy(); container.remove();
});
await check('Effective shortcut remapping updates dispatch, hints, and help without changing host controls', () => {
  const { container, review } = mount({ shortcuts: { left: 'Alt+A' } });
  review.select(3, 10); const surface = container.querySelector('.review-document'); surface.focus();
  key(surface, 'ArrowLeft', { altKey: true }); equal(review.read().length, 0);
  key(surface, 'a', { altKey: true }); equal(review.read().length, 1);
  assert(container.querySelector('[data-command="left"]').title.includes('Alt+A'), 'Stale hint');
  click(container, 'help'); assert(container.querySelector('dialog').textContent.includes('Alt+A'), 'Stale help');
  container.querySelector('dialog').close(); review.destroy(); container.remove();
});
await check('Windows, Linux, and macOS modifier routing supports undo, both redo variants, and scoped export', async () => {
  try {
    for (const platform of ['Win32', 'Linux x86_64', 'MacIntel']) {
      simulatePlatform(platform);
      const { container, review } = mount();
      try {
        const surface = container.querySelector('.review-document');
        const mod = platform === 'MacIntel' ? { metaKey: true } : { ctrlKey: true };
        review.select(3, 10); click(container, 'left'); surface.focus();
        key(surface, 'z', mod); equal(review.read().length, 0, `${platform} undo`);
        key(surface, 'z', { ...mod, shiftKey: true }); equal(review.read().length, 1, `${platform} Shift redo`);
        key(surface, 'z', mod);
        if (platform === 'MacIntel') { key(surface, 'y', { ctrlKey: true }); equal(review.read().length, 0); key(surface, 'z', { ...mod, shiftKey: true }); }
        else key(surface, 'y', { ctrlKey: true });
        equal(review.read().length, 1, `${platform} alternate redo`);
        let exports = 0; container.addEventListener('review:export', () => exports++);
        key(surface, 'e', { ...mod, shiftKey: true }); equal(exports, 1, `${platform} export`);
        const p = container.querySelector('.review-document p'); p.focus(); key(p, 'F2');
        key(p, 'ArrowRight', { shiftKey: true, ...(platform === 'MacIntel' ? { altKey: true } : { ctrlKey: true }) });
        key(p, 'F2'); click(container, 'right'); assert(review.read().some(a => a.labelId === 'right' && a.quote.trim() === 'One'), `${platform} word selection`);
        await tick();
      } finally { review.destroy(); container.remove(); }
    }
  } finally { restorePlatform(); }
});
await check('Invalid mount/shortcut options fail before changing host content', () => {
  const container = document.createElement('div'); container.textContent = 'host'; document.querySelector('#fixtures').append(container);
  for (const extra of [{ labels: [] }, { shortcuts: { left: 'F1' } }, { shortcuts: { invented: 'F9' } }, { exportFormat: 'bad' }]) {
    let rejected = false; try { mountReview(container, { ...options, ...extra }); } catch { rejected = true; }
    assert(rejected, 'Invalid options accepted'); equal(container.textContent, 'host');
  }
  container.remove();
});
await check('Scoped block keys select without committing; saved keys navigate and deletion is undoable', () => {
  const { container, review } = mount(); const heading = container.querySelector('h1'); heading.focus();
  key(heading, 'Enter'); equal(review.read().length, 0); key(heading, 'ArrowLeft', { altKey: true }); equal(review.read().length, 1);
  key(heading, 'n', { altKey: true }); key(document.activeElement, 'Delete'); equal(review.read().length, 0);
  review.undo(); equal(review.read().length, 1); review.destroy(); container.remove();
});
await check('Toolbar block navigation, selection, and precise mode retain the last focused block', () => {
  const { container, review } = mount();
  click(container, 'nextBlock'); click(container, 'nextBlock'); click(container, 'selectBlock');
  click(container, 'left'); equal(review.read()[0].quote, 'One two and link.');
  click(container, 'precise');
  const p = container.querySelector('.review-document p');
  for (let i = 0; i < 3; i++) key(p, 'ArrowRight', { shiftKey: true });
  click(container, 'precise'); click(container, 'right'); equal(review.read()[0].quote, 'One');
  review.destroy(); container.remove();
});
await check('Editable inputs and IME do not dispatch annotation shortcuts', () => {
  const { container, review } = mount(); review.select(3, 10);
  const input = document.createElement('input'); container.querySelector('.review').append(input);
  input.focus(); key(input, 'ArrowLeft', { altKey: true }); equal(review.read().length, 0);
  const surface = container.querySelector('.review-document'); surface.focus(); key(surface, 'ArrowLeft', { altKey: true, isComposing: true }); equal(review.read().length, 0);
  review.destroy(); container.remove();
});
await check('F2 read-only caret navigation extends exact text and crosses supported blocks', () => {
  const { container, review } = mount(); const p = container.querySelector('.review-document p'); p.focus(); key(p, 'F2');
  for (let i = 0; i < 8; i++) key(p, 'ArrowRight', { shiftKey: true });
  key(p, 'F2'); click(container, 'left'); equal(review.read()[0].quote, 'One two ');
  p.focus(); key(p, 'F2');
  for (let i = 0; i < 26; i++) key(p, 'ArrowRight', { shiftKey: true });
  key(p, 'F2'); click(container, 'right'); assert(review.read()[1].quote.includes('\nNext'), 'Selection did not cross paragraphs');
  equal(review.export().document.text, canonicalText(container.querySelector('.review-document')).text);
  review.destroy(); container.remove();
});
await check('Finish resolves pending text before returning data; discard leaves an empty valid export', async () => {
  const { container, review } = mount(); review.select(3, 10); const promise = review.finish();
  const modal = container.querySelector('dialog'); assert(modal.open, 'Resolution dialog missing');
  [...modal.querySelectorAll('button')].find(b => b.textContent.includes('Discard')).click();
  const payload = await promise; equal(payload.selections.left, []); equal(payload.selections.right, []);
  review.destroy(); container.remove();
});
await check('Save rejection retains annotations; retry succeeds once with identical IDs', async () => {
  let attempts = 0, completes = 0;
  const { container, review } = mount({ onFinish: async () => { if (++attempts === 1) throw new Error('Test save failed'); } });
  container.addEventListener('review:complete', () => completes++);
  review.select(3, 10); click(container, 'left'); const before = review.export();
  let failed = false; try { await review.finish(); } catch { failed = true; }
  assert(failed, 'Save rejection swallowed'); equal(review.export(), before); equal(completes, 0);
  await review.finish(); equal(completes, 1); equal(review.export(), before); review.destroy(); container.remove();
});
await check('Edits during asynchronous saving cannot falsely complete a newer review', async () => {
  let resolveSave, completes = 0;
  const { container, review } = mount({ onFinish: () => new Promise(resolve => { resolveSave = resolve; }) });
  container.addEventListener('review:complete', () => completes++);
  review.select(3, 10); click(container, 'left'); const saving = review.finish();
  review.select(20, 24); click(container, 'right'); resolveSave();
  let rejected = false; try { await saving; } catch { rejected = true; }
  assert(rejected, 'Stale save was reported as complete'); equal(completes, 0); equal(review.read().length, 2);
  review.destroy(); container.remove();
});
await check('Destroy restores original host nodes, cancels transient UI, and rejects later mutations', () => {
  const container = document.createElement('div'); const original = document.createElement('p'); original.textContent = 'host node'; container.append(original); document.querySelector('#fixtures').append(container);
  const before = CSS.highlights.size; const review = mountReview(container, options); click(container, 'help'); review.destroy(); review.destroy();
  assert(container.firstChild === original, 'Original node was not restored'); equal(CSS.highlights.size, before);
  let rejected = false; try { review.select(0, 2); } catch { rejected = true; } assert(rejected, 'Destroyed instance accepted a mutation'); container.remove();
});
await check('Multiple instances keep commands and highlight cleanup isolated', () => {
  const first = mount(), second = mount(); first.review.select(3, 10); click(first.container, 'left');
  equal(second.review.read(), []); const before = CSS.highlights.size;
  first.review.destroy(); equal(CSS.highlights.size, before - 4);
  second.review.select(3, 10); click(second.container, 'right'); equal(second.review.read().length, 1);
  second.review.destroy(); first.container.remove(); second.container.remove();
});

await check('Even a one-pixel text drag retains its exact native range instead of selecting the block', () => {
  const { container, review } = mount();
  try {
    const p = container.querySelector('.review-document p');
    p.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: 10, clientY: 10 }));
    const range = document.createRange(); range.setStart(p.firstChild, 1); range.setEnd(p.firstChild, 2);
    getSelection().removeAllRanges(); getSelection().addRange(range);
    p.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: 11, clientY: 10 }));
    click(container, 'left'); equal(review.read()[0].quote, 'n');
  } finally { review.destroy(); container.remove(); }
});
await check('No-target shortcuts preserve browser defaults except scoped destructive keys', () => {
  const { container, review } = mount();
  try {
    const surface = container.querySelector('.review-document'); surface.focus();
    const mod = /Mac/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true };
    for (const [value, modifiers] of [['ArrowLeft', { altKey: true }], ['ArrowRight', { altKey: true }], ['Escape', {}], ['z', mod]]) {
      assert(key(surface, value, modifiers), `Inapplicable ${value} prevented browser default`);
    }
    for (const value of ['Delete', 'Backspace']) assert(!key(surface, value), `${value} was not safely intercepted`);
    equal(review.read(), []); equal(review.export().document.text, canonicalText(surface).text);
  } finally { review.destroy(); container.remove(); }
});
await check('Pending replacement, host-control clicks, link suppression, and toolbar focus follow the interaction defaults', () => {
  const { container, review } = mount(); let pending;
  container.addEventListener('review:selection', event => { pending = event.detail; });
  try {
    const paragraphs = container.querySelectorAll('.review-document p');
    pointerClick(paragraphs[0]); pointerClick(paragraphs[1]);
    equal(pending.quote, 'Next 🌍 世界.'); equal(review.read(), []);
    container.querySelector('[data-command="left"]').focus(); equal(pending.quote, 'Next 🌍 世界.');
    const anchor = container.querySelector('.review-document a');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true }); anchor.dispatchEvent(event);
    assert(event.defaultPrevented, 'Ordinary link click would navigate');
    // A press outside the widget (e.g. a host Save button) keeps the pending range.
    document.querySelector('#summary').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2, isPrimary: true, button: 0 }));
    equal(pending.quote, 'Next 🌍 世界.', 'Outside press dropped the pending selection'); equal(review.read(), []);
    review.undo(); equal(review.read(), []);
  } finally { review.destroy(); container.remove(); }
});
await check('Every toolbar command and keyboard dispatcher path uses the shared operations', async () => {
  const { container, review } = mount(); let selection, exports = 0, completions = 0;
  const surface = container.querySelector('.review-document');
  container.addEventListener('review:selection', event => { selection = event.detail; });
  container.addEventListener('review:export', () => exports++);
  container.addEventListener('review:complete', () => completions++);
  try {
    const expected = ['left', 'right', 'clear', 'remove', 'undo', 'redo', 'previousBlock', 'nextBlock', 'selectBlock', 'precise', 'previousAnnotation', 'nextAnnotation', 'export', 'help', 'finish'];
    equal([...container.querySelectorAll('[data-command]')].map(button => button.dataset.command), expected);
    const mod = /Mac/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true };
    surface.focus(); key(surface, 'ArrowDown', { altKey: true }); equal(document.activeElement.tagName, 'H1');
    key(document.activeElement, 'ArrowDown', { altKey: true }); equal(document.activeElement.tagName, 'P');
    key(document.activeElement, 'ArrowUp', { altKey: true }); equal(document.activeElement.tagName, 'H1');
    key(document.activeElement, 'Enter'); equal(selection.quote, 'Hi');
    key(document.activeElement, 'ArrowLeft', { altKey: true }); equal(review.read().length, 1);
    click(container, 'nextBlock'); click(container, 'selectBlock'); click(container, 'right'); equal(review.read().length, 2);
    click(container, 'previousBlock'); equal(document.activeElement.tagName, 'H1');
    click(container, 'nextAnnotation'); key(document.activeElement, 'n', { altKey: true });
    const second = selection.annotationId; equal(second, review.read()[1].id);
    key(document.activeElement, 'p', { altKey: true }); equal(selection.annotationId, review.read()[0].id);
    click(container, 'previousAnnotation'); equal(selection.annotationId, second);
    click(container, 'left'); equal(review.read()[1].labelId, 'left');
    click(container, 'clear'); equal(selection, null);
    review.select(3, 6); key(surface, 'Escape'); equal(selection, null);
    click(container, 'nextAnnotation'); key(document.activeElement, 'Delete'); equal(review.read().length, 1);
    click(container, 'undo'); equal(review.read().length, 2); click(container, 'redo'); equal(review.read().length, 1);
    key(surface, 'z', mod); equal(review.read().length, 2);
    key(surface, 'z', { ...mod, shiftKey: true }); equal(review.read().length, 1);
    key(surface, 'z', mod); click(container, 'nextAnnotation'); click(container, 'remove'); equal(review.read().length, 1);
    review.select(3, 6); key(surface, 'Backspace'); equal(selection, null);
    review.select(3, 6); key(surface, 'e', { ...mod, shiftKey: true }); equal(exports, 1); equal(selection.quote, 'One');
    click(container, 'export'); equal(exports, 2); equal(selection.quote, 'One');
    click(container, 'clear');
    const nativeButton = container.querySelector('[data-command="help"]'); nativeButton.focus();
    assert(key(nativeButton, 'Enter'), 'Annotator stole Enter from a native button');
    assert(key(nativeButton, 'Tab'), 'Annotator trapped Tab'); assert(key(nativeButton, 'Tab', { shiftKey: true }), 'Annotator trapped Shift+Tab');
    key(surface, 'F1'); assert(container.querySelector('dialog')?.open, 'F1 did not open help');
    const help = container.querySelector('dialog');
    const closed = new Promise(resolve => help.addEventListener('close', resolve, { once: true }));
    help.dispatchEvent(new Event('cancel', { cancelable: true })); await closed;
    click(container, 'help'); assert(container.querySelector('dialog')?.open, 'Help control did not open help');
    const helpAgain = container.querySelector('dialog');
    const closedAgain = new Promise(resolve => helpAgain.addEventListener('close', resolve, { once: true }));
    helpAgain.close(); await closedAgain;
    key(surface, 'Enter', mod); await tick(); equal(completions, 1);
    click(container, 'finish'); await tick(); equal(completions, 2);
    assert(Object.values(review.shortcuts).flat().includes('F2'), 'F2 missing from effective map');
  } finally { review.destroy(); container.remove(); }
});
await check('Saved highlight precedence and the overlap chooser preserve one explicit edit target', async () => {
  const { container, review } = mount(); let selection;
  container.addEventListener('review:selection', event => { selection = event.detail; });
  try {
    review.select(3, 10); click(container, 'left'); const first = review.read()[0];
    review.select(3, 7); click(container, 'right'); const second = review.read().find(a => a.id !== first.id);
    const p = container.querySelector('.review-document p'); p.scrollIntoView({ block: 'center' });
    const rectangle = canonicalText(container.querySelector('.review-document')).range(3, 6).getClientRects()[0];
    const init = { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: rectangle.left + 2, clientY: (rectangle.top + rectangle.bottom) / 2 };
    p.dispatchEvent(new PointerEvent('pointerdown', init)); p.dispatchEvent(new PointerEvent('pointerup', init));
    const modal = container.querySelector('dialog'); assert(modal?.open, 'Click on overlap did not open chooser');
    const choices = [...modal.querySelectorAll('button')]; choices[0].focus(); key(choices[0], 'ArrowDown');
    assert(document.activeElement === choices[1], 'Chooser arrow did not focus the second choice');
    const chosen = new Promise(resolve => modal.addEventListener('close', resolve, { once: true }));
    document.activeElement.click(); await chosen;
    assert([first.id, second.id].includes(selection.annotationId), 'Chooser did not activate a single saved target');
    equal(review.read().length, 2); click(container, 'remove'); equal(review.read().length, 1); review.undo(); equal(review.read().length, 2);
    review.activate(first.id); key(container.querySelector('.review-document'), 'Escape'); equal(selection, null);
  } finally { review.destroy(); container.remove(); }
});
await check('Finish resolves either label, discard, cancel, and an empty session without duplicate commits', async () => {
  for (const choice of ['Accept', 'Reject', 'Discard pending selection', 'Cancel']) {
    const { container, review } = mount(); let completed = 0, selection;
    container.addEventListener('review:complete', () => completed++);
    container.addEventListener('review:selection', event => { selection = event.detail; });
    try {
      review.select(3, 10); const finishing = review.finish();
      const modal = container.querySelector('dialog');
      [...modal.querySelectorAll('button')].find(button => button.textContent === choice).click();
      const payload = await finishing;
      if (choice === 'Cancel') { equal(payload, null); equal(completed, 0); equal(selection.quote, 'One two'); }
      else {
        equal(completed, 1); const expected = choice === 'Discard pending selection' ? 0 : 1;
        equal(review.read().length, expected); equal(Object.values(payload.selections).flat().length, expected);
        if (expected) equal(review.read()[0].labelId, choice === 'Accept' ? 'left' : 'right');
      }
    } finally { review.destroy(); container.remove(); }
  }
  const { container, review } = mount();
  try { const payload = await review.finish(); equal(payload.selections, { left: [], right: [] }); }
  finally { review.destroy(); container.remove(); }
});
await check('Destroying pending completion resolves it without callbacks, UI, or leaked highlights', async () => {
  let saved = 0; const before = CSS.highlights.size;
  const { container, review } = mount({ onFinish: () => saved++ });
  review.select(3, 10); const promise = review.finish();
  review.destroy(); equal(await promise, null); equal(saved, 0); equal(container.children.length, 0); equal(CSS.highlights.size, before); container.remove();
});

// Center of the first client rectangle of a canonical range, read at call time.
function rangePoint(container, start, end) {
  const surface = container.querySelector('.review-document');
  surface.querySelector('p').scrollIntoView({ block: 'center' });
  const rect = canonicalText(surface).range(start, end).getClientRects()[0];
  return { clientX: (rect.left + rect.right) / 2, clientY: (rect.top + rect.bottom) / 2 };
}
// Dispatch a wheel event at a viewport point; returns the event so callers can inspect defaultPrevented.
function wheel(container, point, init) {
  const surface = container.querySelector('.review-document');
  // An open modal makes the document inert to hit testing; still deliver to the surface to exercise the guard.
  const hit = document.elementFromPoint(point.clientX, point.clientY);
  const target = surface.contains(hit) ? hit : surface;
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaMode: 0, ...point, ...init });
  target.dispatchEvent(event);
  return event;
}

await check('Pure horizontal wheel over pending text labels once per direction and never cancels scrolling', () => {
  for (const [direction, deltaX] of [['left', -30], ['right', 30]]) {
    const { container, review } = mount();
    try {
      review.select(3, 10);
      const point = rangePoint(container, 3, 10);
      const first = wheel(container, point, { deltaX, deltaY: 0 });
      assert(!first.defaultPrevented, `${direction}: wheel was canceled`);
      equal(review.read().length, 1, `${direction}: wrong commit count`);
      equal(review.read()[0].labelId, direction); equal(review.read()[0].quote, 'One two');
      // Later events of the same stream find no pending range; the saved annotation is not relabeled.
      for (const repeat of [deltaX, deltaX, -deltaX]) assert(!wheel(container, point, { deltaX: repeat, deltaY: 0 }).defaultPrevented, 'Repeat was canceled');
      equal(review.read().length, 1, `${direction}: repeated events committed again`);
      equal(review.read()[0].labelId, direction, `${direction}: repeated events relabeled`);
    } finally { review.destroy(); container.remove(); }
  }
});

await check('Vertical, mixed-axis, zoom-chord, outside, no-pending, saved-only and dialog-open wheel input never labels', () => {
  const scenarios = ['vertical', 'mixed', 'ctrl', 'meta', 'outside', 'no pending', 'saved only', 'dialog'];
  for (const scenario of scenarios) {
    const { container, review } = mount(); let pending;
    container.addEventListener('review:selection', event => { pending = event.detail; });
    try {
      if (scenario === 'saved only') {
        // An active left annotation would be relabeled by a rightward classify; wheel must not do that.
        review.select(3, 10); click(container, 'left'); review.activate(review.read()[0].id);
      } else if (scenario !== 'no pending') review.select(3, 10);
      if (scenario === 'dialog') click(container, 'help');
      // "outside" hovers the heading, which lies outside the pending rectangles.
      const point = scenario === 'outside' ? rangePoint(container, 0, 2) : rangePoint(container, 3, 10);
      const init = {
        vertical: { deltaX: 0, deltaY: 30 },
        mixed: { deltaX: 30, deltaY: 2 },
        ctrl: { deltaX: 30, deltaY: 0, ctrlKey: true },
        meta: { deltaX: 30, deltaY: 0, metaKey: true },
      }[scenario] ?? { deltaX: 30, deltaY: 0 };
      const before = review.read();
      const event = wheel(container, point, init);
      assert(!event.defaultPrevented, `${scenario}: wheel was canceled`);
      equal(review.read(), before, `${scenario}: annotations changed`);
      if (!['no pending', 'saved only'].includes(scenario)) equal(pending?.quote, 'One two', `${scenario}: pending lost`);
      if (scenario === 'dialog') container.querySelector('dialog').close();
    } finally { review.destroy(); container.remove(); }
  }
});

await check('Known limitation: a late wheel event after a new selection labels that new range', () => {
  // Portable APIs cannot tell old momentum from a new gesture; plan 18 records this as open native evidence.
  const { container, review } = mount();
  try {
    review.select(3, 10); wheel(container, rangePoint(container, 3, 10), { deltaX: -30, deltaY: 0 });
    review.select(11, 14); wheel(container, rangePoint(container, 11, 14), { deltaX: -30, deltaY: 0 });
    equal(review.read().map(a => a.quote), ['One two', 'and']);
  } finally { review.destroy(); container.remove(); }
});

await check('A pointer press on pending text is left to native selection: no cancel, capture or preview', () => {
  const { container, review } = mount();
  try {
    const surface = container.querySelector('.review-document');
    let captured = false; surface.setPointerCapture = () => { captured = true; };
    review.select(3, 10);
    const point = rangePoint(container, 3, 10);
    const init = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, button: 0, ...point };
    const down = new PointerEvent('pointerdown', init); surface.querySelector('p').dispatchEvent(down);
    assert(!down.defaultPrevented, 'Press on pending text prevented native selection');
    assert(!captured, 'Press on pending text captured the pointer');
    assert(!container.querySelector('.review-swipe-preview'), 'Press on pending text showed a swipe preview');
    surface.querySelector('p').dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: point.clientX + 90 }));
    equal(review.read(), [], 'Pointer drag labeled text');
  } finally { review.destroy(); container.remove(); }
});

await check('All displayed shortcut hints and help use Cmd on Mac and Ctrl elsewhere, including remapping', () => {
  try {
    for (const platform of ['MacIntel', 'Win32', 'Linux x86_64']) {
      simulatePlatform(platform);
      const { container, review } = mount({ shortcuts: { undo: 'mod+Q' } });
      try {
        const modifier = platform === 'MacIntel' ? 'Cmd' : 'Ctrl';
        for (const [command, suffix] of [['undo', 'Q'], ['redo', 'Shift+Z'], ['finish', 'Enter'], ['export', 'Shift+E']]) {
          const button = container.querySelector(`[data-command="${command}"]`);
          assert(button.title.includes(`${modifier}+${suffix}`), `${platform} ${command} lacks concrete modifier: ${button.title}`);
          assert(!button.title.includes('Mod+'), `${platform} exposes Mod in a tooltip`);
        }
        equal(container.querySelector('[data-command="undo"]').getAttribute('aria-keyshortcuts'), `${platform === 'MacIntel' ? 'Meta' : 'Control'}+Q`);
        click(container, 'help'); const help = container.querySelector('dialog');
        assert(help.textContent.includes(`${modifier}+Q`), `${platform} remapped help is wrong`);
        assert(!help.textContent.includes('Mod+'), `${platform} help exposes Mod`);
      } finally { review.destroy(); container.remove(); }
    }
  } finally { restorePlatform(); }
});

await check('Platform detection prefers userAgentData, falls back to navigator.platform, and drives every Mod site', () => {
  try {
    // [navigator.platform, userAgentData.platform, expected Apple]
    for (const [platform, userAgentPlatform, apple] of [['', 'macOS', true], ['iPad', undefined, true], ['MacIntel', 'Windows', false]]) {
      simulatePlatform(platform, userAgentPlatform);
      const { container, review } = mount();
      try {
        const undo = container.querySelector('[data-command="undo"]');
        const scenario = `${platform || '(empty)'}/${userAgentPlatform ?? '(none)'}`;
        assert(undo.title.includes(`${apple ? 'Cmd' : 'Ctrl'}+Z`), `${scenario} tooltip: ${undo.title}`);
        equal(undo.getAttribute('aria-keyshortcuts'), `${apple ? 'Meta' : 'Control'}+Z`, `${scenario} aria-keyshortcuts`);
        const p = container.querySelector('.review-document p'); p.focus(); key(p, 'F2');
        key(p, 'ArrowRight', { shiftKey: true, ...(apple ? { altKey: true } : { ctrlKey: true }) });
        key(p, 'F2'); click(container, 'right');
        equal(review.read()[0]?.quote.trim(), 'One', `${scenario} word selection`);
      } finally { review.destroy(); container.remove(); }
    }
  } finally { restorePlatform(); }
});

await check('Public undo and redo leave precise mode and repaint like the keyboard path', () => {
  const { container, review } = mount();
  try {
    review.select(3, 10); click(container, 'left');
    const p = container.querySelector('.review-document p'); const whisper = container.querySelector('.review-whisper');
    const precise = () => !whisper.hidden && whisper.dataset.state === 'precise';
    p.focus(); key(p, 'F2'); assert(precise(), 'F2 did not enter precise mode');
    equal(review.undo(), true); assert(!precise(), 'Public undo stayed in precise mode');
    assert(key(p, 'ArrowRight', { shiftKey: true }), 'Arrow keys still drive the precise caret after undo');
    p.focus(); key(p, 'F2'); equal(review.redo(), true); assert(!precise(), 'Public redo stayed in precise mode');
    equal(review.read().length, 1); equal(review.redo(), false);
  } finally { review.destroy(); container.remove(); }
});

// Widget UI (plan 23 / 25 slice 4).
const platformMod = () => /Mac/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true };
const undoHint = () => /Mac/.test(navigator.platform) ? 'Cmd+Z' : 'Ctrl+Z';
const closeDialog = async dialog => {
  const closed = new Promise(resolve => dialog.addEventListener('close', resolve, { once: true }));
  dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  await closed;
};

await check('Navbar names the document by optional title with ID fallback; a non-string title is rejected', () => {
  const titled = mount({ document: { ...options.document, title: 'Project notes' } });
  const plain = mount();
  try {
    equal(titled.container.querySelector('.review-title').textContent.trim(), 'Project notes');
    equal(plain.container.querySelector('.review-title').textContent.trim(), 'check.md');
  } finally { titled.review.destroy(); plain.review.destroy(); titled.container.remove(); plain.container.remove(); }
  const host = document.createElement('div'); host.textContent = 'host'; document.querySelector('#fixtures').append(host);
  let rejected = false; try { mountReview(host, { ...options, document: { ...options.document, title: 42 } }); } catch { rejected = true; }
  assert(rejected, 'Non-string title accepted'); equal(host.textContent, 'host'); host.remove();
});

await check('••• swaps title and action strip in one fixed-height row without moving the document or the target', () => {
  const { container, review } = mount(); let events = 0, exports = 0;
  try {
    const navbar = container.querySelector('.review-navbar'), surface = container.querySelector('.review-document');
    const toggle = container.querySelector('.review-more'), strip = container.querySelector('.review-actions'), title = container.querySelector('.review-title');
    review.select(3, 10);
    container.addEventListener('review:selection', () => events++);
    container.addEventListener('review:export', () => exports++);
    const height = navbar.getBoundingClientRect().height, top = surface.getBoundingClientRect().top;
    equal(height, 62, 'Navbar height');
    equal(toggle.getAttribute('aria-expanded'), 'false'); assert(strip.hidden && !title.hidden, 'Strip should start collapsed');
    toggle.click();
    equal(toggle.getAttribute('aria-expanded'), 'true'); assert(!strip.hidden && title.hidden, 'Toggle did not swap in the strip');
    equal(navbar.getBoundingClientRect().height, height, 'Navbar height changed'); equal(surface.getBoundingClientRect().top, top, 'Document moved');
    equal([...strip.querySelectorAll('[data-command]')].map(b => b.dataset.command), ['left', 'right', 'clear', 'remove', 'undo', 'redo', 'previousBlock', 'nextBlock', 'selectBlock', 'precise', 'previousAnnotation', 'nextAnnotation', 'export']);
    const labelNames = [...strip.querySelectorAll('[data-command="left"],[data-command="right"]')].map(b => b.textContent);
    assert(labelNames[0].includes('Accept') && labelNames[1].includes('Reject'), `Label buttons lack configured names: ${labelNames}`);
    const exportButton = strip.querySelector('[data-command="export"]'); equal(exportButton.textContent, 'Export files');
    exportButton.click(); equal(exports, 1, 'Export files control');
    key(surface, 'e', { ...platformMod(), shiftKey: true }); equal(exports, 2, 'Mod+Shift+E');
    toggle.click(); assert(strip.hidden && !title.hidden, 'Toggle did not restore the title');
    equal(navbar.getBoundingClientRect().height, height); equal(surface.getBoundingClientRect().top, top);
    equal(events, 0, 'Toggling changed the selection'); equal(review.read(), []);
  } finally { review.destroy(); container.remove(); }
});

await check('First Escape collapses an open strip and keeps the target; the next Escape clears it', () => {
  const { container, review } = mount(); let selection;
  container.addEventListener('review:selection', event => { selection = event.detail; });
  try {
    review.select(3, 10); const toggle = container.querySelector('.review-more');
    toggle.click(); const left = container.querySelector('.review-actions [data-command="left"]'); left.focus();
    assert(!key(left, 'Escape'), 'Escape that collapsed the strip was not handled');
    equal(toggle.getAttribute('aria-expanded'), 'false'); assert(document.activeElement === toggle, 'Focus did not return to •••');
    equal(selection?.quote, 'One two', 'Collapsing cleared the target');
    key(toggle, 'Escape'); equal(selection, null, 'Second Escape did not clear');
  } finally { review.destroy(); container.remove(); }
});

await check('Keyboard icon and F1 open the same keycap help with actual labels; closing keeps the target and focus', async () => {
  const { container, review } = mount({ labels: [{ id: 'left', name: 'Evidence', direction: 'left' }, { id: 'right', name: 'Question', direction: 'right' }] });
  let selection;
  container.addEventListener('review:selection', event => { selection = event.detail; });
  try {
    review.select(3, 10); const surface = container.querySelector('.review-document');
    const icon = container.querySelector('.review-navbar [data-command="help"]');
    assert(icon && !icon.closest('.review-actions'), 'Keyboard icon is not in the navbar');
    icon.focus(); icon.click();
    const help = container.querySelector('dialog'); assert(help?.open, 'Keyboard icon did not open help');
    const content = help.textContent;
    for (const expected of ['Label Evidence', 'Label Question', 'Export files', undoHint()]) assert(content.includes(expected), `Help lacks ${expected}`);
    assert(help.querySelectorAll('kbd').length > 10, 'Help has no keycaps');
    assert(help.querySelector('details summary')?.textContent.includes('Selection'), 'Selection commands not in an expandable section');
    assert(help.querySelector('details').textContent.includes('Precise selection'), 'Precise selection missing from expandable section');
    await closeDialog(help);
    assert(document.activeElement === icon, 'Focus did not return to the keyboard icon'); equal(selection?.quote, 'One two', 'Help cleared the target');
    surface.focus(); key(surface, 'F1');
    const again = container.querySelector('dialog'); assert(again?.open, 'F1 did not open help');
    equal(again.textContent, content, 'F1 and the icon open different help');
    await closeDialog(again); assert(document.activeElement === surface, 'Focus did not return to the document'); equal(selection?.quote, 'One two');
  } finally { review.destroy(); container.remove(); }
});

await check('Whisper is absent when idle, after clear and after undo; shows pending, precise, assigned and active copy', () => {
  const { container, review } = mount();
  try {
    const whisper = container.querySelector('.review-whisper'), surface = container.querySelector('.review-document');
    // Whisper words are generated content (data-text), so they never become document text.
    const centre = () => [...whisper.querySelectorAll('.review-whisper-state [data-text]')].map(part => part.dataset.text).join('');
    const ends = () => [...whisper.querySelectorAll('.review-whisper-end')].map(end => end.dataset.text);
    equal(whisper.textContent, '', 'Whisper owns text nodes');
    const shown = () => !whisper.hidden && whisper.isConnected;
    assert(!shown(), 'Whisper visible while idle');
    assert(!whisper.closest('[aria-live]') && !whisper.hasAttribute('aria-live'), 'Whisper would double-announce');
    review.select(3, 10);
    assert(shown(), 'No whisper for pending text'); equal(whisper.dataset.state, 'pending');
    equal(ends(), ['← Accept', 'Reject →']); assert(centre().startsWith('Unlabeled'), `Pending copy: ${centre()}`);
    assert(whisper.previousElementSibling === surface.querySelector('p'), 'Whisper is not below the passage');
    equal(canonicalText(surface).text, review.export().document.text, 'Whisper entered canonical text');
    click(container, 'clear'); assert(!shown(), 'Whisper remained after clear');
    review.select(3, 10); click(container, 'left');
    assert(shown(), 'No just-assigned confirmation'); equal(whisper.dataset.state, 'assigned');
    equal(centre(), `✓ Accept · ${undoHint()} undo`); equal(ends(), ['← ✓ Accept', 'Reject →']);
    assert(whisper.querySelector('[data-end="left"]').classList.contains('review-whisper-checked'), 'Assigned endpoint not marked');
    review.undo(); assert(!shown(), 'Whisper remained after undo');
    review.redo(); review.activate(review.read()[0].id);
    assert(shown(), 'No whisper for the active annotation'); equal(whisper.dataset.state, 'active'); equal(centre(), '✓ Accept · ••• to edit');
    key(surface, 'Escape'); assert(!shown(), 'Whisper remained after Escape');
    const p = surface.querySelector('p'); p.focus(); key(p, 'F2');
    assert(shown(), 'No whisper in precise mode'); equal(whisper.dataset.state, 'precise'); equal(centre(), 'Selecting text');
    key(p, 'F2'); assert(!shown(), 'Whisper remained after leaving precise mode without a range');
  } finally { review.destroy(); container.remove(); }
});

const failed = results.filter(r => !r.passed).length;
document.querySelector('#summary').textContent = `${failed ? 'FAIL' : 'PASS'}: ${results.length - failed}/${results.length} real-browser checks`;
document.title = document.querySelector('#summary').textContent;
document.body.dataset.result = failed ? 'fail' : 'pass';
