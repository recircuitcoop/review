const copy = value => structuredClone(value);
// Annotation records are never mutated: edits build new records and arrays.
// Freezing enforces that, so undo/redo history can hold arrays by reference.
const freeze = record => Object.freeze(record);
const compare = (a, b) => a.start - b.start || a.end - b.end || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const requiredString = value => typeof value === 'string' && value.trim().length > 0;

export function validateOptions({ document, labels }) {
  if (!document || !requiredString(document.id) || !requiredString(document.version)) throw new Error('Document ID and immutable version are required.');
  if (!Array.isArray(labels) || labels.length !== 2 || labels.some(l => !l || !requiredString(l.id) || !requiredString(l.name))) throw new Error('Exactly two labels with IDs and names are required.');
  if (new Set(labels.map(l => l.id)).size !== 2 || new Set(labels.map(l => l.direction)).size !== 2 || labels.some(l => !['left', 'right'].includes(l.direction))) throw new Error('Labels need distinct IDs and one left/right assignment each.');
}

/** One authority for committed annotations and their undo history. */
export class ReviewSession {
  #annotations = [];
  // Pending ranges in document order: disjoint, never touching. `#recent` is the one added last.
  #pending = [];
  #recent = null;
  #activeId = null;
  #undo = [];
  #redo = [];
  #document;
  #labels;
  #emit;
  #revision = 0;

  constructor({ document, labels, text }, onEvent = () => {}) {
    validateOptions({ document, labels });
    if (typeof text !== 'string') throw new Error('Canonical text must be a string.');
    this.#document = { id: document.id, version: document.version, text, canonicalFormat: 'review-text-v1', offsetUnit: 'utf-16', endExclusive: true };
    this.#labels = labels.map(({ id, name, direction }) => ({ id, name, direction }));
    this.#emit = (name, detail) => onEvent(name, copy(detail));
  }

  /** The most recently added pending range (what the whisper follows), or null. */
  get pending() { return copy(this.#recent); }
  /** Every pending range in document order; a label commits all of them. */
  get pendingRanges() { return copy(this.#pending); }
  get activeId() { return this.#activeId; }
  get text() { return this.#document.text; }
  get labels() { return copy(this.#labels); }
  get revision() { return this.#revision; }
  read() { return copy([...this.#annotations].sort(compare)); }

  anchor(start, end) {
    const text = this.text;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end > text.length || start >= end) throw new Error('Selection needs a nonempty in-document integer range.');
    return { start, end, quote: text.slice(start, end), prefix: text.slice(Math.max(0, start - 32), start), suffix: text.slice(end, end + 32) };
  }

  /** Replace the pending set with one range. */
  select(start, end) {
    const pending = this.anchor(start, end);
    this.#pending = [pending];
    this.#recent = pending;
    this.#activeId = null;
    this.#emit('selection', pending);
    return copy(pending);
  }

  /** Add a range to the pending set (Shift); overlapping or touching ranges merge into one. */
  add(start, end) {
    let merged = this.anchor(start, end);
    const joined = this.#pending.filter(p => p.start <= merged.end && merged.start <= p.end);
    if (joined.length) {
      merged = this.anchor(Math.min(merged.start, ...joined.map(p => p.start)), Math.max(merged.end, ...joined.map(p => p.end)));
    }
    this.#pending = [...this.#pending.filter(p => !joined.includes(p)), merged].sort(compare);
    this.#recent = merged;
    this.#activeId = null;
    this.#emit('selection', merged);
    return copy(merged);
  }

  clear() {
    this.#pending = []; this.#recent = null; this.#activeId = null;
    this.#emit('selection', null);
  }

  activate(id) {
    if (!this.#annotations.some(a => a.id === id)) throw new Error('Unknown annotation ID.');
    this.#pending = []; this.#recent = null; this.#activeId = id;
    this.#emit('selection', { annotationId: id });
  }

  #commit(next) {
    const previous = this.#annotations;
    this.#undo.push(previous);
    this.#redo = [];
    this.#annotations = next;
    this.#revision++;
    this.#changes(previous, next);
  }

  #changes(previous, next) {
    for (const a of previous) if (!next.some(b => b.id === a.id)) this.#emit('delete', a);
    for (const a of next) {
      const old = previous.find(b => b.id === a.id);
      if (!old) this.#emit('create', a);
      else if (old.labelId !== a.labelId) this.#emit('update', a);
    }
  }

  classify(labelId) {
    if (!this.#labels.some(l => l.id === labelId)) throw new Error('Unknown label ID.');
    if (this.#pending.length) {
      // One annotation per pending range, committed together so one undo removes them all.
      const created = this.#pending.map(range => freeze({ id: crypto.randomUUID(), documentId: this.#document.id, documentVersion: this.#document.version, labelId, ...range }));
      const recent = created[this.#pending.indexOf(this.#recent)];
      this.#pending = []; this.#recent = null; this.#activeId = null;
      this.#commit([...this.#annotations, ...created]);
      this.clear();
      return copy(recent);
    }
    if (this.#activeId) return this.relabel(this.#activeId, labelId);
    return null;
  }

  relabel(id, labelId) {
    const target = this.#annotations.find(a => a.id === id);
    if (!target) throw new Error('Unknown annotation ID.');
    if (!this.#labels.some(l => l.id === labelId)) throw new Error('Unknown label ID.');
    if (target.labelId === labelId) return copy(target);
    this.#commit(this.#annotations.map(a => a.id === id ? freeze({ ...a, labelId }) : a));
    return copy(this.#annotations.find(a => a.id === id));
  }

  delete(id) {
    if (!this.#annotations.some(a => a.id === id)) throw new Error('Unknown annotation ID.');
    this.#commit(this.#annotations.filter(a => a.id !== id));
    if (this.#activeId === id) this.clear();
  }

  #travel(from, to) {
    this.clear();
    if (!from.length) return false;
    const previous = this.#annotations;
    to.push(previous);
    this.#annotations = from.pop();
    this.#revision++;
    this.#changes(previous, this.#annotations);
    return true;
  }
  undo() { return this.#travel(this.#undo, this.#redo); }
  redo() { return this.#travel(this.#redo, this.#undo); }

  export(format = 'grouped') {
    if (!['grouped', 'split'].includes(format)) throw new Error('Export format must be grouped or split.');
    const base = { schemaVersion: 1, document: copy(this.#document), labels: this.labels };
    const selections = Object.fromEntries(this.#labels.map(l => [l.id, this.read().filter(a => a.labelId === l.id)]));
    if (format === 'split') return this.#labels.map(l => ({ ...copy(base), selections: { [l.id]: selections[l.id] } }));
    return { ...base, selections };
  }

  restore(input) {
    const payloads = Array.isArray(input) ? input : [input];
    if (payloads.length !== (Array.isArray(input) ? 2 : 1)) throw new Error('Restore needs a grouped payload or both split payloads.');
    const annotations = [], groups = new Set(), ids = new Set();
    for (const payload of payloads) {
      if (!payload || payload.schemaVersion !== 1 || !payload.document || Object.entries(this.#document).some(([key, value]) => payload.document[key] !== value)) throw new Error('Restore document identity, version, canonical text, or format does not match.');
      if (!Array.isArray(payload.labels) || payload.labels.length !== 2 || new Set(payload.labels.map(l => l?.id)).size !== 2 || this.#labels.some(label => !payload.labels.some(candidate => candidate && ['id', 'name', 'direction'].every(key => candidate[key] === label[key])))) throw new Error('Restore labels do not match this session.');
      if (!payload.selections || typeof payload.selections !== 'object' || Array.isArray(payload.selections)) throw new Error('Restore selections must be grouped by label ID.');
      if (Array.isArray(input) && Object.keys(payload.selections).length !== 1) throw new Error('Each split payload must contain one label group.');
      for (const [labelId, values] of Object.entries(payload.selections)) {
        if (!this.#labels.some(l => l.id === labelId) || groups.has(labelId) || !Array.isArray(values)) throw new Error('Invalid or duplicate restore label group.');
        groups.add(labelId);
        for (const a of values) {
          if (!a || !requiredString(a.id) || ids.has(a.id) || a.labelId !== labelId || a.documentId !== this.#document.id || a.documentVersion !== this.#document.version) throw new Error('Invalid annotation identity, label, or duplicate ID.');
          const anchor = this.anchor(a.start, a.end);
          for (const field of ['quote', 'prefix', 'suffix']) if (a[field] !== anchor[field]) throw new Error(`Annotation ${a.id}: ${field} does not match its positions.`);
          ids.add(a.id);
          annotations.push(freeze({ id: a.id, documentId: a.documentId, documentVersion: a.documentVersion, labelId, ...anchor }));
        }
      }
    }
    if (groups.size !== 2) throw new Error('Restore must include both label groups, including empty groups.');
    this.#annotations = annotations.sort(compare);
    this.#revision++;
    this.#undo = []; this.#redo = []; this.clear();
  }
}
