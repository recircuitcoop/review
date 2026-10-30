import { marked } from '../node_modules/marked/lib/marked.esm.js';
import DOMPurify from '../node_modules/dompurify/dist/purify.es.mjs';

// Supported Markdown subset; anything else is stripped by the sanitizer.
const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'br', 'hr', 'del'];
export const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,pre';

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The block a click or focus selects. A list item or code block wins over the paragraph/code inside it. */
export function selectableBlock(target) {
  return target.closest('li,pre') ?? target.closest(BLOCK_SELECTOR);
}

/**
 * The canonical range a click or Enter on `block` selects. A heading takes its section, up to
 * the next heading of the same or higher rank; a list item takes its nested hierarchy.
 */
export function blockScope(surface, text, block) {
  const contents = document.createRange();
  contents.selectNodeContents(block);
  const { start, end } = text.fromRange(contents);
  const level = Number(/^H([1-6])$/.exec(block.tagName)?.[1]);
  if (level) {
    const next = [...surface.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .find(h => block.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING && Number(h.tagName[1]) <= level);
    if (!next) return { start, end: text.text.length };
    // The section ends with the last rendered content before the next heading element.
    const section = document.createRange();
    section.setStart(contents.startContainer, contents.startOffset);
    section.setEndBefore(next);
    return { start, end: text.contentEnd(text.fromRange(section).end) };
  }
  // Nested blocks close with their own separators inside the item; the range ends on content.
  return { start, end: text.contentEnd(end) };
}

/** Render sanitized Markdown into the surface and return its keyboard-focusable blocks in document order. */
export function renderMarkdown(surface, markdown) {
  const html = marked.parse(markdown, { gfm: false });
  surface.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ['href', 'title', 'start'], ALLOW_DATA_ATTR: false });
  // Skip nested candidates (e.g. a <p> inside an <li>) so each block is one navigation stop.
  const blocks = [...surface.querySelectorAll(BLOCK_SELECTOR)].filter(block => selectableBlock(block) === block);
  for (const block of blocks) {
    block.tabIndex = -1;
  }
  return blocks;
}

/** Per-instance CSS Custom Highlight names, so several mounted annotators never share highlights. */
export function highlightNames(token) {
  return {
    left: `${token}-left`,
    right: `${token}-right`,
    pending: `${token}-pending`,
    active: `${token}-active`,
  };
}

/** Highlight colors come from the instance's custom properties so themes and styles apply. */
export function highlightStyle(names) {
  return [
    `::highlight(${names.left}) { background: var(--review-mark-left-bg); color: var(--review-mark-left-text); text-decoration: underline solid var(--review-mark-left-border) 2px; }`,
    `::highlight(${names.right}) { background: var(--review-mark-right-bg); color: var(--review-mark-right-text); text-decoration: underline solid var(--review-mark-right-border) 2px; }`,
    `::highlight(${names.pending}) { background: var(--review-mark-pending-bg); color: var(--review-mark-pending-text); text-decoration: underline solid var(--review-mark-pending-text) 1px; }`,
    `::highlight(${names.active}) { background: var(--review-mark-active-bg); color: var(--review-mark-active-text); text-decoration: underline; }`,
  ].join(' ');
}

/** Replace all four highlight sets from session state (`pending` lists every pending range); highlights never touch the document DOM. */
export function paintHighlights({ names, text, labels, annotations, pending, active }) {
  for (const direction of ['left', 'right']) {
    const label = labels.find(l => l.direction === direction);
    const ranges = annotations.filter(a => a.labelId === label.id).map(a => text.range(a.start, a.end));
    CSS.highlights.set(names[direction], new Highlight(...ranges));
  }
  CSS.highlights.set(names.pending, new Highlight(...pending.map(p => text.range(p.start, p.end))));
  const activeRanges = active ? [text.range(active.start, active.end)] : [];
  CSS.highlights.set(names.active, new Highlight(...activeRanges));
}

// Static Lucide outlines (ISC licence), inlined so the widget needs no icon dependency.
const ICONS = {
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  keyboard: '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
};

/** A decorative 18px icon; its control carries the accessible name. */
export function icon(name) {
  const holder = document.createElement('span');
  holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
  return holder.firstChild;
}

// The document block each whisper is currently laid under.
const anchoredBlocks = new WeakMap();

/**
 * Lay the whisper over the existing spacing below `block` (null forgets it). It is an
 * overlay outside the document, so caret movement and selection never enter it, and it
 * never changes any block's size or margin, so document text never moves for it. The
 * uniform block spacing (`paragraphSpacing`) is sized to hold one whisper line.
 */
export function placeWhisper(whisper, layout, block) {
  if (!block) {
    anchoredBlocks.delete(whisper);
    return;
  }
  anchoredBlocks.set(whisper, block);
  const origin = layout.getBoundingClientRect();
  const rect = block.getBoundingClientRect();
  // Width first: long label names wrap, and the centring below follows the real height.
  whisper.style.left = `${rect.left - origin.left}px`;
  whisper.style.width = `${rect.width}px`;
  const room = parseFloat(getComputedStyle(block).marginBottom) || 0;
  whisper.style.top = `${rect.bottom - origin.top + Math.max(0, (room - whisper.offsetHeight) / 2)}px`;
}

/** Re-lay the whisper after reflow (resize, fonts); offsets never depend on this. */
export function repositionWhisper(whisper, layout) {
  const block = anchoredBlocks.get(whisper);
  if (block && !whisper.hidden) placeWhisper(whisper, layout, block);
}

/**
 * The contextual whisper, derived from session state plus the presentation-only
 * `assignedId` (the annotation just labeled). It holds no committed data; label
 * names always come from the current configuration. Hidden when there is no target.
 */
export function paintWhisper({ whisper, layout, surface, text, labels, annotations, pending, active, precise, assignedId, focusedBlock, undoKeys, expanded, held }) {
  const assigned = annotations.find(a => a.id === assignedId);
  let state = null;
  let target = null;
  if (precise) {
    state = 'precise';
    target = pending;
  } else if (pending) {
    state = 'pending';
    target = pending;
  } else if (active) {
    state = 'active';
    target = active;
  } else if (assigned) {
    state = 'assigned';
    target = assigned;
  }
  whisper.hidden = state === null;
  if (!state) {
    placeWhisper(whisper, layout, null);
    return;
  }

  const checked = state === 'active' || state === 'assigned' ? labels.find(l => l.id === target.labelId) : null;
  whisper.dataset.state = state;
  whisper.dataset.assigned = checked?.direction ?? '';
  for (const label of labels) {
    const node = whisper.querySelector(`[data-end="${label.direction}"]`);
    const name = checked === label ? `✓ ${label.name}` : label.name;
    node.dataset.text = label.direction === 'left' ? `← ${name}` : `${name} →`;
    node.classList.toggle('review-whisper-checked', checked === label);
  }

  // Centre: the state first, then the next useful action. Narrow widths hide the hint (CSS).
  const status = whisper.querySelector('.review-whisper-status');
  const hint = whisper.querySelector('.review-whisper-hint');
  if (state === 'precise') {
    status.dataset.text = 'Selecting text';
    hint.dataset.text = '';
  } else if (state === 'pending') {
    status.dataset.text = 'Unlabeled';
    hint.dataset.text = expanded ? ' · choose above' : ' · scroll ← → over selection';
  } else if (state === 'active') {
    status.dataset.text = `✓ ${checked.name}`;
    hint.dataset.text = ' · ••• to edit';
  } else {
    // The Undo shortcut stays even when narrow: it is the approved recovery affordance.
    status.dataset.text = `✓ ${checked.name} · ${undoKeys} undo`;
    hint.dataset.text = '';
  }

  // Below the final selected line: the block holding the range end. Precise mode stays under
  // the block where the caret started, so extending the selection never moves the layout.
  let anchor = focusedBlock;
  if (state !== 'precise') {
    const end = text.range(target.start, target.end).endContainer;
    anchor = end.nodeType === Node.TEXT_NODE ? end.parentElement : end;
  }
  // During a pointer press the placement holds still, so a drag never moves text under the pointer.
  if (held && anchoredBlocks.has(whisper)) {
    placeWhisper(whisper, layout, anchoredBlocks.get(whisper));
    return;
  }
  const block = anchor ? selectableBlock(anchor) : null;
  placeWhisper(whisper, layout, block && surface.contains(block) ? block : null);
}

/** Rebuild the saved-annotation sidebar; each entry activates its annotation for editing. */
export function renderSavedList({ list, count, labels, annotations, activeId }) {
  count.textContent = `Annotations (${annotations.length})`;
  list.replaceChildren();
  for (const annotation of annotations) {
    const label = labels.find(l => l.id === annotation.labelId);
    const button = element('button', 'review-saved-item', `${label.name}: ${annotation.quote}`);
    button.type = 'button';
    button.dataset.annotationId = annotation.id;
    button.setAttribute('aria-pressed', String(activeId === annotation.id));
    const item = element('li');
    item.append(button);
    list.append(item);
  }
}
