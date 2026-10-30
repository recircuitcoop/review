const BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE']);

/** Canonical positions are text identity; highlights and geometry never enter this map. */
export function canonicalText(root) {
  const segments = [];
  let text = '';
  const append = (value, node, kind = 'text') => {
    if (!value) return;
    segments.push({ node, kind, start: text.length, end: text.length + value.length });
    text += value;
  };
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const betweenBlocks = /^\s*$/.test(node.data) && [...node.parentElement.children].some(c => BLOCKS.has(c.tagName) || ['UL', 'OL'].includes(c.tagName));
      if (!betweenBlocks) append(node.data, node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === 'BR') { append('\n', node, 'br'); return; }
    for (const child of node.childNodes) walk(child);
    if (BLOCKS.has(node.tagName) && segments.at(-1)?.kind !== 'separator') append('\n', node, 'separator');
  }
  for (const node of root.childNodes) walk(node);
  while (segments.at(-1)?.kind === 'separator') text = text.slice(0, segments.pop().start);

  function boundary(segment, end) {
    if (segment.kind === 'text') return [segment.node, end ? segment.node.data.length : 0];
    const parent = segment.node.parentNode;
    const index = [...parent.childNodes].indexOf(segment.node);
    return [parent, index + (segment.kind === 'separator' || end ? 1 : 0)];
  }
  function offset(node, position) {
    if (node !== root && !root.contains(node)) throw new Error('Selection is outside the document.');
    const direct = segments.find(s => s.node === node && s.kind === 'text');
    if (direct) return direct.start + Math.min(position, node.data.length);
    const point = document.createRange(); point.setStart(node, position); point.collapse(true);
    let result = 0;
    for (const s of segments) {
      const edge = document.createRange(); edge.setStart(...boundary(s, true)); edge.collapse(true);
      if (edge.compareBoundaryPoints(Range.START_TO_START, point) <= 0) result = s.end;
      else break;
    }
    return result;
  }
  function point(position, end) {
    if (position < 0 || position > text.length) throw new Error('Text position is outside the document.');
    const s = segments.find(s => s.kind === 'text' && (end ? position > s.start && position <= s.end : position >= s.start && position < s.end));
    if (s) return [s.node, position - s.start];
    const next = segments.find(s => s.start >= position && s.kind === 'text');
    if (!end && next) return [next.node, 0];
    const previous = segments.filter(s => s.end <= position && s.kind === 'text').at(-1);
    if (previous) return [previous.node, previous.node.data.length];
    return next ? [next.node, 0] : [root, 0];
  }
  return {
    text, offset,
    range(start, end) {
      const range = document.createRange(); range.setStart(...point(start, false)); range.setEnd(...point(end, true));
      return range;
    },
    fromRange(range) { return { start: offset(range.startContainer, range.startOffset), end: offset(range.endContainer, range.endOffset) }; },
    /** The end of the last rendered content (text or line break, never a block separator) at or before `position`. */
    contentEnd(position) { return segments.filter(s => s.kind !== 'separator' && s.end <= position).at(-1)?.end ?? 0; },
  };
}
