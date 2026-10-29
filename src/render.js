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

/** Replace all four highlight sets from committed state; highlights never touch the document DOM. */
export function paintHighlights({ names, text, labels, annotations, pending, active }) {
  for (const direction of ['left', 'right']) {
    const label = labels.find(l => l.direction === direction);
    const ranges = annotations.filter(a => a.labelId === label.id).map(a => text.range(a.start, a.end));
    CSS.highlights.set(names[direction], new Highlight(...ranges));
  }
  const pendingRanges = pending ? [text.range(pending.start, pending.end)] : [];
  CSS.highlights.set(names.pending, new Highlight(...pendingRanges));
  const activeRanges = active ? [text.range(active.start, active.end)] : [];
  CSS.highlights.set(names.active, new Highlight(...activeRanges));
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
