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

test('history keeps annotation arrays by reference; public reads stay detached copies', () => {
  const s = session();
  s.select(0, 5); s.classify('accept');
  s.select(6, 8); s.classify('reject');
  const [first, second] = s.read();
  // Records are immutable, so commits and undo/redo must not deep-copy the annotation array.
  const clone = globalThis.structuredClone;
  const clonedArrays = [];
  globalThis.structuredClone = value => { if (Array.isArray(value)) clonedArrays.push(value); return clone(value); };
  try {
    s.select(9, 14); s.classify('accept');
    s.activate(first.id); s.classify('reject');
    s.delete(second.id);
    s.undo(); s.redo(); s.undo();
  } finally { globalThis.structuredClone = clone; }
  assert.equal(clonedArrays.length, 0);
  const read = s.read();
  read[0].quote = 'tampered'; read.pop();
  assert.equal(s.read().length, 3);
  assert.equal(s.read()[0].quote, 'Hello');
  assert.equal(s.export().selections.reject[0].quote, 'Hello');
});

test('actual browser-downloaded label fixtures retain quotes and restore together', () => {
  const payloads = ['left', 'right'].map(label => JSON.parse(readFileSync(new URL(`./artifacts/browser-${label}.json`, import.meta.url), 'utf8')));
  const first = payloads[0];
  const s = new ReviewSession({ document: first.document, labels: first.labels, text: first.document.text });
  s.restore(payloads);
  assert.equal(s.read().length, 2);
  for (const annotation of s.read()) assert.equal(s.text.slice(annotation.start, annotation.end), annotation.quote);
});

test('Shift-style add merges overlapping or touching ranges; select replaces the whole set', () => {
  const s = session();
  s.select(0, 5);
  s.add(5, 8);
  assert.deepEqual(s.pendingRanges.map(r => [r.start, r.end]), [[0, 8]]);
  s.add(10, 12);
  assert.deepEqual(s.pendingRanges.map(r => [r.start, r.end]), [[0, 8], [10, 12]]);
  // A range bridging two pending ranges merges all three into one contiguous range.
  const merged = s.add(7, 11);
  assert.deepEqual([merged.start, merged.end], [0, 12]);
  assert.deepEqual(s.pendingRanges.map(r => [r.start, r.end]), [[0, 12]]);
  s.add(16, 21);
  // The most recent range is the one the whisper follows.
  assert.equal(s.pending.quote, 'Hello');
  assert.throws(() => s.add(3, 3));
  assert.equal(s.pendingRanges.length, 2);
  s.select(1, 2);
  assert.deepEqual(s.pendingRanges.map(r => [r.start, r.end]), [[1, 2]]);
  s.clear();
  assert.deepEqual(s.pendingRanges, []);
  assert.equal(s.pending, null);
});

test('classify commits every pending range as one undo step', () => {
  const s = session();
  s.select(0, 5); s.classify('reject');
  const saved = s.read()[0].id;
  s.activate(saved);
  // Appending ends saved-annotation editing and starts a pending set.
  s.add(16, 21); s.add(6, 8);
  assert.equal(s.activeId, null);
  const created = [];
  const observed = new ReviewSession(options(), (name, detail) => { if (name === 'create') created.push(detail.quote); });
  observed.select(16, 21); observed.add(6, 8);
  observed.classify('accept');
  assert.deepEqual(created, ['🌍', 'Hello']);
  const recent = s.classify('accept');
  assert.equal(recent.quote, '🌍');
  assert.deepEqual(s.read().map(a => [a.quote, a.labelId]), [['Hello', 'reject'], ['🌍', 'accept'], ['Hello', 'accept']]);
  assert.deepEqual(s.pendingRanges, []);
  assert.equal(s.undo(), true);
  assert.deepEqual(s.read().map(a => a.id), [saved]);
  assert.equal(s.redo(), true);
  assert.equal(s.read().length, 3);
  assert.equal(s.export().selections.accept.length, 2);
});
