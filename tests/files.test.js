import test from 'node:test';
import assert from 'node:assert/strict';
import { ReviewSession } from '../src/model.js';
import { exportFiles } from '../src/files.js';
const labels = [{ id: 'l', name: 'Accept', direction: 'left' }, { id: 'r', name: 'Reject', direction: 'right' }];
function session(names = labels) { return new ReviewSession({ document: { id: 'notes.md', version: '1' }, labels: names, text: 'hello world' }); }

test('split files include both configured labels for empty, one-sided and complete reviews', () => {
  for (const assigned of [[], ['l'], ['r'], ['l', 'r']]) {
    const review = session();
    assigned.forEach((label, i) => { review.select(i * 6, i * 6 + 5); review.classify(label); });
    const before = review.export();
    const files = exportFiles('notes.md', review.export('split'));
    assert.deepEqual(files.map(f => f.name), ['notes_Accept.json', 'notes_Reject.json']);
    const payloads = files.map(f => JSON.parse(f.content));
    assert.deepEqual(payloads.map(p => Object.values(p.selections)[0].length), ['l', 'r'].map(id => assigned.includes(id) ? 1 : 0));
    const restored = session(); restored.restore(payloads); assert.deepEqual(restored.export(), before);
  }
});
test('filenames preserve spaces/Unicode/case and sanitize only filesystem-unsafe characters', () => {
  const review = session([{ ...labels[0], name: 'Needs review' }, { ...labels[1], name: 'Cafe\u0301 / 世界?' }]);
  assert.deepEqual(exportFiles('chapter.v2.MARKDOWN', review.export('split')).map(f => f.name), ['chapter.v2_Needs review.json', 'chapter.v2_Café _ 世界_.json']);
  assert.equal(exportFiles('notes.md', review.export())[0].name, 'notes_all.json');
  assert.equal(exportFiles('a:b.md', review.export())[0].name, 'a_b_all.json');
});
test('empty or colliding sanitized names reject without mutating review state', () => {
  for (const names of [['Keep', 'keep'], ['A/', 'A?'], ['Café', 'Cafe\u0301'], ['...', 'Valid']]) {
    const review = session(labels.map((label, i) => ({ ...label, name: names[i] })));
    const before = review.export(); assert.throws(() => exportFiles('notes.md', review.export('split')), /empty|collid/i); assert.deepEqual(review.export(), before);
  }
  assert.throws(() => exportFiles('.md', session().export()), /empty/i);
});

test('saved metadata configures the original source; renamed JSON and reversed split order are irrelevant', async () => {
  const { readDocument, savedReviewOptions } = await import('../src/files.js');
  const document = await readDocument({ name: 'notes.md', text: async () => 'hello world' });
  const review = new ReviewSession({ document, labels, text: 'hello world' });
  review.select(0, 5); review.classify('l');
  for (const payload of [review.export(), review.export('split').reverse()]) {
    const options = savedReviewOptions(document, payload);
    assert.deepEqual(options.labels, labels); assert.deepEqual(options.document, document);
    const reopened = new ReviewSession({ ...options, text: 'hello world' });
    reopened.restore(payload); assert.deepEqual(reopened.read(), review.read()); assert.equal(reopened.undo(), false);
  }
});
test('saved opening rejects changed or renamed source, missing partner and invalid label metadata', async () => {
  const { readDocument, savedReviewOptions } = await import('../src/files.js');
  const document = await readDocument({ name: 'notes.md', text: async () => 'hello world' });
  const review = new ReviewSession({ document, labels, text: 'hello world' });
  const payload = review.export();
  assert.throws(() => savedReviewOptions({ ...document, version: 'changed' }, payload), /source|version/i);
  assert.throws(() => savedReviewOptions({ ...document, id: 'renamed.md' }, payload), /source|identity/i);
  assert.throws(() => savedReviewOptions(document, review.export('split')[0]), /both.*split|partner/i);
  assert.throws(() => savedReviewOptions(document, { ...payload, labels: [] }), /labels/i);
});
