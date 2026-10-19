import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ReviewSession } from '../src/model.js';

const labels = [
  { id: 'accept', name: 'Accept', direction: 'left' },
  { id: 'reject', name: 'Reject', direction: 'right' },
];
const options = () => ({ document: { id: 'sample.md', version: 'v1' }, labels, text: 'Hello 🌍 world.\nHello 世界.' });
const session = () => new ReviewSession(options());

test('selection stays pending; classification commits exactly once with UTF-16 anchors', () => {
  const s = session();
  s.select(6, 8);
  assert.equal(s.read().length, 0);
  s.classify('accept');
  s.classify('accept');
  assert.equal(s.read().length, 1);
  assert.equal(s.read()[0].quote, '🌍');
  assert.equal(s.pending, null);
  assert.equal(s.export().selections.reject.length, 0);
});

test('overlaps edit independently and history preserves identities', () => {
  const s = session();
  s.select(0, 5); s.classify('accept');
  const id = s.read()[0].id;
  s.select(0, 8); s.classify('reject');
  const second = s.read()[1].id;
  s.activate(id); s.classify('reject');
  s.delete(second);
  assert.equal(s.read().length, 1);
  s.undo(); s.undo();
  assert.deepEqual(s.read().map(a => a.labelId), ['accept', 'reject']);
  s.undo(); s.undo();
  assert.equal(s.read().length, 0);
  for (let i = 0; i < 4; i++) s.redo();
  assert.deepEqual(s.read().map(a => a.id), [id]);
  s.undo(); s.select(1, 4); s.classify('accept');
  assert.equal(s.redo(), false);
});

test('grouped/split export and restore preserve text, labels, order, overlaps, and identity', () => {
  const s = session();
  s.select(16, 21); s.classify('reject');
  s.select(0, 5); s.classify('accept');
  s.select(0, 8); s.classify('reject');
  const expected = s.export();
  for (const payload of [expected, s.export('split')]) {
    const restored = session();
    restored.restore(payload);
    assert.deepEqual(restored.export(), expected);
    assert.equal(restored.undo(), false);
  }
  s.select(2, 3);
  s.export();
  assert.equal(s.pending.quote, 'l');
  const exported = s.export(); exported.labels[0].name = 'Changed';
  exported.selections.accept[0].quote = 'Changed';
  assert.deepEqual(s.export(), expected);
});

test('restore validates everything before changing live annotations or pending state', () => {
  const s = session(); s.select(0, 5); s.classify('accept'); s.select(2, 3);
  const expected = s.export();
  const invalid = [
    p => { p.document.version = 'v2'; },
    p => { p.document.text = 'different'; },
    p => { p.document.offsetUnit = 'unicode'; },
    p => { p.schemaVersion = 999; },
    p => { p.labels[0].id = 'other'; },
    p => { p.selections.accept[0].quote = 'other'; },
    p => { p.selections.accept[0].end = 1000; },
    p => { p.selections.accept[0].start = 0.5; },
    p => { p.selections.accept[0].prefix = 'other'; },
    p => { p.selections.accept.push(p.selections.accept[0]); },
    p => { p.selections.reject.push(p.selections.accept[0]); },
  ];
  for (const mutate of invalid) {
    const payload = structuredClone(expected); mutate(payload);
    assert.throws(() => s.restore(payload));
    assert.deepEqual(s.export(), expected);
    assert.equal(s.pending.quote, 'l');
  }
  assert.throws(() => s.restore(s.export('split').slice(0, 1)));
});

test('invalid inputs and ranges never mutate state', () => {
  for (const extra of [{ labels: [] }, { document: { id: '', version: '' } }, { labels: [labels[0], labels[0]] }]) {
    assert.throws(() => new ReviewSession({ ...options(), ...extra }));
  }
  const s = session();
  for (const range of [[0, 0], [-1, 2], [2, 1], [0, Infinity], [0.2, 2], [0, 500]]) assert.throws(() => s.select(...range));
  s.select(0, 5);
  assert.throws(() => s.classify('unknown'));
  assert.equal(s.read().length, 0);
  s.undo();
  assert.equal(s.pending, null);
});

test('restore compares metadata values rather than JSON property order', () => {
  const source = session(); source.select(0, 5); source.classify('accept');
  const payload = source.export();
  payload.document = Object.fromEntries(Object.entries(payload.document).reverse());
  payload.labels = payload.labels.reverse().map(label => Object.fromEntries(Object.entries(label).reverse()));
  const target = session(); target.restore(payload);
  assert.deepEqual(target.export(), source.export());
});

test('creation observers see committed state with no pending selection', () => {
  let observed;
  const s = new ReviewSession(options(), name => { if (name === 'create') observed = { pending: s.pending, count: s.read().length }; });
  s.select(0, 5); s.classify('accept');
  assert.deepEqual(observed, { pending: null, count: 1 });
});

test('actual browser-downloaded label fixtures retain quotes and restore together', () => {
  const payloads = ['left', 'right'].map(label => JSON.parse(readFileSync(new URL(`./artifacts/browser-${label}.json`, import.meta.url), 'utf8')));
  const first = payloads[0];
  const s = new ReviewSession({ document: first.document, labels: first.labels, text: first.document.text });
  s.restore(payloads);
  assert.equal(s.read().length, 2);
  for (const annotation of s.read()) assert.equal(s.text.slice(annotation.start, annotation.end), annotation.quote);
});
