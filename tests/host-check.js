import '../src/app.js';
import { ReviewSession } from '../src/model.js';

const summary = document.createElement('h2'); summary.id = 'host-check-summary';
const output = document.createElement('pre'); output.id = 'host-check-results';
document.body.prepend(summary, output);
const results = [];
const equal = (actual, expected, message = 'Values differ') => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`); };
const assert = (value, message) => { if (!value) throw new Error(message); };
const delay = () => new Promise(resolve => setTimeout(resolve, 10));
async function waitFor(predicate) { for (let i = 0; i < 300; i++) { if (predicate()) return; await delay(); } throw new Error('Host operation timed out: ' + document.querySelector('#host-status').textContent); }
async function check(name, operation) {
  try { await operation(); results.push(`PASS ${name}`); }
  catch (error) { results.push(`FAIL ${name}: ${error.message}`); }
  output.textContent = results.join('\n');
}
function files(id, entries) {
  const transfer = new DataTransfer(); entries.forEach(file => transfer.items.add(file));
  document.querySelector(id).files = transfer.files;
}
async function submit(id) { document.querySelector(id).requestSubmit(); await waitFor(() => !document.querySelector(`${id} button[type=submit]`).disabled); }
const command = name => document.querySelector(`#annotator [data-command="${name}"]`).click();
function selectBlock(index = 0) {
  const block = document.querySelectorAll('#annotator .review-document p')[index]; block.focus();
  block.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
}
async function exported() { command('export'); return Promise.all([...document.querySelectorAll('#downloads a')].map(async link => ({ name: link.download, payload: await readDownload(link.href) }))); }
// Inspect generated downloads without requiring blob: fetch permissions in the host CSP.
const downloadBlobs = new Map();
const createObjectURL = URL.createObjectURL, revokeObjectURL = URL.revokeObjectURL;
URL.createObjectURL = blob => { const url = createObjectURL.call(URL, blob); downloadBlobs.set(url, blob); return url; };
URL.revokeObjectURL = url => { downloadBlobs.delete(url); revokeObjectURL.call(URL, url); };
async function readDownload(url) {
  const blob = downloadBlobs.get(url);
  if (!blob) throw new Error('Download URL was revoked or not created by this host');
  return JSON.parse(await blob.text());
}
const markdown = '# Review\n\nHello **world**. Hello again.\n\nEmoji 🌍 世界.\n\n- Item one\n- Item two\n\n```js\n  code\n```';
const original = new File([markdown], 'notes.md', { type: 'text/markdown' });
const jsonFile = (payload, index = 0) => new File([JSON.stringify(payload)], `arbitrary-${index}.json`, { type: 'application/json' });
let baseline, saved, pending, confirmation = true, confirmations = 0;
const originalConfirm = window.confirm;
window.confirm = () => { confirmations++; return confirmation; };
document.querySelector('#annotator').addEventListener('review:selection', event => { pending = event.detail; }, true);
async function reopen(payloads, source = original) {
  files('#reopen-markdown', [source]); files('#saved-files', payloads.map(jsonFile)); await submit('#reopen');
}

try {
  await check('New local review exports both named empty labels without automatic downloads', async () => {
    files('#markdown-file', [original]); document.querySelector('#left-label').value = 'Keep'; document.querySelector('#right-label').value = 'Needs review';
    await submit('#setup'); assert(document.querySelector('#annotator .review'), 'Markdown did not open');
    const data = await exported(); equal(data.map(file => file.name), ['notes_Keep.json', 'notes_Needs review.json']);
    equal(data.map(file => Object.values(file.payload.selections)[0]), [[], []]); baseline = data[0].payload;
    assert(document.querySelector('#host-status').textContent.includes('Click each'), 'No explicit delivery instruction');
  });
  await check('Committed data exports while pending text stays selected; stale links disappear after edits', async () => {
    selectBlock(0); command('left'); selectBlock(1); const before = pending;
    const data = await exported(); equal(pending, before); equal(Object.values(data[0].payload.selections)[0].length, 1); equal(Object.values(data[1].payload.selections)[0].length, 0);
    command('right'); equal(document.querySelectorAll('#downloads a').length, 0);
  });
  await check('Grouped reopening restores saved label IDs, names, overlaps and a fresh history baseline', async () => {
    const labels = [{ id: 'keep-id', name: 'Conserver', direction: 'left' }, { id: 'drop-id', name: 'À revoir', direction: 'right' }];
    const model = new ReviewSession({ document: baseline.document, text: baseline.document.text, labels });
    const start = model.text.indexOf('Hello'); model.select(start, start + 11); model.classify('keep-id'); model.select(start, start + 5); model.classify('drop-id');
    const code = model.text.indexOf('  code'); model.select(code, code + 6); model.classify('keep-id');
    saved = model.export(); await reopen([saved]);
    assert(document.querySelector('#host-status').textContent.startsWith('Reopened'), 'Saved review did not open');
    equal(document.querySelector('#left-label').value, 'Conserver'); equal(document.querySelector('#right-label').value, 'À revoir');
    command('undo'); const data = await exported(); equal(data.map(file => file.name), ['notes_Conserver.json', 'notes_À revoir.json']);
    equal(data.flatMap(file => Object.values(file.payload.selections).flat()).map(a => a.id).sort(), model.read().map(a => a.id).sort());
  });
  await check('Invalid input leaves current session, pending range, history and download URLs intact', async () => {
    selectBlock(1); const expected = pending; const root = document.querySelector('#annotator .review');
    const hrefs = [...document.querySelectorAll('#downloads a')].map(link => link.href); const beforeConfirm = confirmations;
    const variants = [
      saved && { ...saved, document: { ...saved.document, version: 'changed' } },
      saved && { ...saved, selections: { 'keep-id': saved.selections['keep-id'] } },
      saved && { ...saved, selections: { ...saved.selections, 'keep-id': saved.selections['keep-id'].map(a => ({ ...a, quote: 'wrong' })) } }
    ];
    for (const input of variants) {
      await reopen([input]); assert(document.querySelector('#host-status').textContent.startsWith('Could not open'), 'Invalid review accepted');
      assert(document.querySelector('#annotator .review') === root, 'Invalid candidate replaced current review'); equal(pending, expected); equal([...document.querySelectorAll('#downloads a')].map(link => link.href), hrefs);
    }
    await reopen([saved], new File([markdown + '\nChanged'], 'notes.md')); assert(document.querySelector('#annotator .review') === root, 'Changed source accepted');
    files('#saved-files', [new File(['{broken'], 'bad.json')]); await submit('#reopen'); assert(document.querySelector('#annotator .review') === root, 'Broken JSON replaced review');
    equal(confirmations, beforeConfirm, 'Invalid input asked to replace work before validation');
  });
  await check('Canceling a valid replacement preserves pending selection and the current review', async () => {
    const root = document.querySelector('#annotator .review'), expected = pending;
    confirmation = false; await reopen([saved]); confirmation = true;
    assert(document.querySelector('#annotator .review') === root, 'Canceled replacement swapped sessions'); equal(pending, expected);
  });
  await check('Reopen, relabel/delete/add, undo/redo, export and reversed split reopen preserve the full updated review', async () => {
    await reopen([saved]);
    const first = document.querySelector('#annotator [data-annotation-id]'); first.click(); command('left');
    document.querySelectorAll('#annotator [data-annotation-id]')[1].click(); command('remove'); command('undo'); command('redo');
    selectBlock(1); command('left');
    const data = await exported(); const updated = data.map(file => file.payload);
    equal(updated.flatMap(payload => Object.values(payload.selections).flat()).length, 3);
    await reopen(updated.slice().reverse()); const again = await exported(); equal(again.map(file => file.payload), updated);
    command('undo'); equal((await exported()).map(file => file.payload), updated, 'Reopened baseline was undoable');
    await reopen([updated[0]]); assert(document.querySelector('#host-status').textContent.includes('partner'), 'Missing split partner was silently accepted');
  });
  await check('Split metadata conflicts and canceled loading controls preserve the active review', async () => {
    const data = (await exported()).map(file => file.payload), root = document.querySelector('#annotator .review');
    data[1].labels[0].name = 'Different session'; await reopen(data);
    assert(document.querySelector('#host-status').textContent.startsWith('Could not open'), 'Conflicting split metadata accepted'); assert(document.querySelector('#annotator .review') === root, 'Conflicting split replaced review');
    selectBlock(1); const expected = pending;
    document.querySelector('#reopen').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); equal(pending, expected, 'Loading controls cleared pending work');
  });
  await check('Theme switching preserves exact selection, overlapping annotations, dialogs, focus and history', async () => {
    selectBlock(1); command('right');
    const data = (await exported()).map(file => file.payload);
    const p = document.querySelector('#annotator .review-document p'); p.focus();
    const range = document.createRange(); range.setStart(p.firstChild, 1); range.setEnd(p.firstChild, 3);
    getSelection().removeAllRanges(); getSelection().addRange(range); document.dispatchEvent(new Event('selectionchange'));
    const selected = pending, quote = getSelection().toString();
    const button = document.querySelector('#theme-toggle'), root = document.documentElement;
    const initial = root.dataset.theme, color = getComputedStyle(root).backgroundColor, originalFocus = document.activeElement;
    let stored, modal; try { stored = window.localStorage.getItem('review-theme'); } catch {}
    try {
      const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true }); button.dispatchEvent(event); assert(event.defaultPrevented, 'Theme pointer action could collapse selection');
      button.click(); assert(root.dataset.theme !== initial, 'Theme did not switch'); equal(button.getAttribute('aria-pressed'), String(root.dataset.theme === 'dark'));
      assert(getComputedStyle(root).backgroundColor !== color, 'Theme colors did not change'); assert(document.activeElement === originalFocus, 'Theme moved document focus'); equal(pending, selected); equal(getSelection().toString(), quote, 'Theme changed native range');
      command('help'); modal = document.querySelector('#annotator dialog');
      const focused = document.activeElement, modalQuote = getSelection().toString();
      // Native modal inertness can hide document text from Selection.toString(). Compare within the same modal state.
      button.click(); equal(root.dataset.theme, initial); assert(modal.open, 'Theme closed a dialog'); assert(document.activeElement === focused, 'Theme moved dialog focus'); equal(pending, selected); equal(getSelection().toString(), modalQuote, 'Theme changed selection inside modal');
      equal(getComputedStyle(modal).backgroundColor, getComputedStyle(document.querySelector('#annotator .review')).backgroundColor, 'Dialog palette differs from panel');
      const style = document.querySelector('#annotator style').textContent;
      for (const role of ['left', 'right', 'pending', 'active']) assert(style.includes(`var(--review-mark-${role}-bg`), `${role} highlight ignores theme`);
    } finally {
      if (root.dataset.theme !== initial) button.click();
      try { if (stored == null) window.localStorage.removeItem('review-theme'); else window.localStorage.setItem('review-theme', stored); } catch {}
      if (modal?.open) { const closed = new Promise(resolve => modal.addEventListener('close', resolve, { once: true })); modal.close(); await closed; }
    }
    equal((await exported()).map(file => file.payload), data, 'Theme changed export');
    command('undo'); equal((await exported()).flatMap(file => Object.values(file.payload.selections).flat()).length, 3);
    command('redo'); equal((await exported()).map(file => file.payload), data, 'Theme destroyed history');
  });
  await check('Keyboard export and Done use the same two-file host delivery without losing data', async () => {
    const data = (await exported()).map(file => file.payload), surface = document.querySelector('#annotator .review-document');
    let completed = 0; document.querySelector('#annotator').addEventListener('review:complete', () => completed++, { once: true, capture: true });
    const modifiers = /Mac/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true };
    surface.focus(); surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', shiftKey: true, bubbles: true, cancelable: true, ...modifiers }));
    equal(await Promise.all([...document.querySelectorAll('#downloads a')].map(async link => readDownload(link.href))), data);
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...modifiers }));
    await waitFor(() => completed === 1); equal(await Promise.all([...document.querySelectorAll('#downloads a')].map(async link => readDownload(link.href))), data);
  });
} finally { window.confirm = originalConfirm; URL.createObjectURL = createObjectURL; URL.revokeObjectURL = revokeObjectURL; }
const failures = results.filter(result => result.startsWith('FAIL')).length;
summary.textContent = `${failures ? 'FAIL' : 'PASS'}: ${results.length - failures}/${results.length} host checks`;
document.title = summary.textContent;
