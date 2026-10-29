import { mountReview } from '../src/review.js';
import { canonicalText } from '../src/text.js';

// Plan 17 developer probe. Run `npm start` and open /tests/wheel-probe.html.
const host = document.querySelector('#fixture');
const rows = document.querySelector('#log tbody');
const markdown = await (await fetch('/tests/fixtures/review.md')).text();
mountReview(host, {
  document: { id: 'probe.md', version: 'v1', markdown },
  labels: [{ id: 'left', name: 'Left label', direction: 'left' }, { id: 'right', name: 'Right label', direction: 'right' }],
});
const surface = host.querySelector('.review-document');
const text = canonicalText(surface);

// Offsets only; the quote is never stored or shown.
let pending = null;
host.addEventListener('review:selection', event => {
  const detail = event.detail;
  pending = detail && detail.annotationId === undefined ? { start: detail.start, end: detail.end } : null;
});

/** Same geometry test as the library: pending rectangles read at event time. */
function overPending(x, y) {
  if (!pending) return false;
  const rectangles = [...text.range(pending.start, pending.end).getClientRects()];
  return rectangles.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
}

let count = 0;
// Capture on window and stop propagation so the annotator never sees (or labels from) the event.
// No preventDefault: native scrolling, zoom and navigation stay observable.
window.addEventListener('wheel', event => {
  event.stopPropagation();
  count += 1;
  const values = [
    count,
    event.deltaX,
    event.deltaY,
    event.deltaMode,
    event.ctrlKey,
    event.metaKey,
    event.shiftKey,
    event.cancelable,
    overPending(event.clientX, event.clientY),
    event.deltaX !== 0 && event.deltaY === 0,
  ];
  const row = document.createElement('tr');
  for (const value of values) {
    const cell = document.createElement('td');
    cell.textContent = String(value);
    row.append(cell);
  }
  rows.prepend(row);
  // Keep the table readable during momentum streams.
  while (rows.children.length > 200) rows.lastElementChild.remove();
}, { capture: true, passive: true });

document.querySelector('#clear-log').addEventListener('click', () => {
  rows.replaceChildren();
  count = 0;
});
window.addEventListener('scroll', () => {
  document.querySelector('#scroll-position').textContent = `Page scroll: ${Math.round(scrollX)}px, ${Math.round(scrollY)}px`;
}, { passive: true });
