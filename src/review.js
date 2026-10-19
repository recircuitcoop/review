import { marked } from '../node_modules/marked/lib/marked.esm.js';
import DOMPurify from '../node_modules/dompurify/dist/purify.es.mjs';
import { ReviewSession, validateOptions } from './model.js';
import { canonicalText } from './text.js';
import { swipeDirection } from './gesture.js';

const DEFAULT_SHORTCUTS = {
  nextBlock: ['Alt+ArrowDown'], previousBlock: ['Alt+ArrowUp'], selectBlock: ['Enter'], precise: ['F2'],
  left: ['Alt+ArrowLeft'], right: ['Alt+ArrowRight'], clear: ['Escape'], remove: ['Delete', 'Backspace'],
  nextAnnotation: ['Alt+N'], previousAnnotation: ['Alt+P'], undo: ['Mod+Z'],
  redo: ['Mod+Shift+Z', 'Ctrl+Y'], export: ['Mod+Shift+E'], finish: ['Mod+Enter'], help: ['F1'],
};
const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'br', 'hr', 'del'];
const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,pre';

function selectableBlock(target) {
  return target.closest('li,pre') ?? target.closest(BLOCK_SELECTOR);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function shortcutMap(overrides = {}) {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  const defaults = structuredClone(DEFAULT_SHORTCUTS);
  if (mac) defaults.redo = ['Mod+Shift+Z'];
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Shortcut overrides must be a command map.');
  for (const [command, value] of Object.entries(overrides)) {
    if (!Object.hasOwn(defaults, command)) throw new Error(`Unknown shortcut command: ${command}`);
    const keys = typeof value === 'string' ? [value] : value;
    if (!Array.isArray(keys) || !keys.length || keys.some(k => typeof k !== 'string' || !k.trim())) throw new Error(`Invalid shortcut for ${command}.`);
    defaults[command] = [...keys];
  }
  const normalize = value => {
    const parts = value.toLowerCase().replaceAll('mod', mac ? 'meta' : 'ctrl').split('+');
    const key = parts.pop();
    if (!key || parts.some(p => !['ctrl', 'alt', 'shift', 'meta'].includes(p)) || new Set(parts).size !== parts.length) throw new Error(`Invalid shortcut: ${value}`);
    return [...parts.sort(), key].join('+');
  };
  const bindings = new Map();
  for (const [command, values] of Object.entries(defaults)) for (const value of values) {
    const key = normalize(value);
    if (bindings.has(key)) throw new Error(`Shortcut conflict: ${value}`);
    bindings.set(key, command);
  }
  return { effective: defaults, command(event) {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('ctrl'); if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift'); if (event.metaKey) modifiers.push('meta');
    return bindings.get([...modifiers.sort(), event.key.toLowerCase()].join('+'));
  } };
}

/** Mount a local, read-only annotator. Host persistence and downloads remain outside the library. */
export function mountReview(container, options) {
  if (!(container instanceof HTMLElement)) throw new Error('Mount needs an HTML container.');
  validateOptions(options);
  if (typeof options.document.markdown !== 'string') throw new Error('Markdown source must be a string.');
  if (!globalThis.CSS?.highlights || !globalThis.Highlight || !getSelection()?.modify) throw new Error('This browser needs CSS Custom Highlight and Selection.modify support. Use a current desktop browser.');
  const shortcuts = shortcutMap(options.shortcuts);
  const format = options.exportFormat ?? 'grouped';
  if (!['grouped', 'split'].includes(format)) throw new Error('Export format must be grouped or split.');
  const original = [...container.childNodes];
  const root = element('section', 'review'); root.setAttribute('aria-label', 'Document annotator');
  const toolbar = element('div', 'review-toolbar'); toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', 'Annotation controls');
  const surface = element('article', 'review-document'); surface.tabIndex = 0; surface.setAttribute('aria-label', 'Read-only document');
  surface.innerHTML = DOMPurify.sanitize(marked.parse(options.document.markdown, { gfm: false }), { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ['href', 'title', 'start'], ALLOW_DATA_ATTR: false });
  const blocks = [...surface.querySelectorAll(BLOCK_SELECTOR)].filter(block => selectableBlock(block) === block);
  for (const block of blocks) block.tabIndex = -1;
  const layout = element('div', 'review-layout');
  const sidebar = element('aside', 'review-saved'); sidebar.setAttribute('aria-label', 'Saved annotations');
  const list = element('ol', 'review-annotation-list');
  const count = element('h2', '', 'Annotations (0)'); sidebar.append(count, list);
  const status = element('p', 'review-status', 'Click a paragraph, heading, list item, or code block; or drag an exact range.'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const mode = element('p', 'review-mode', 'Read-only · F2 for precise keyboard selection');
  layout.append(surface, sidebar); root.append(toolbar, mode, layout, status);
  const token = `review-${crypto.randomUUID()}`;
  const names = { left: `${token}-left`, right: `${token}-right`, pending: `${token}-pending`, active: `${token}-active` };
  const style = element('style');
  style.textContent = `::highlight(${names.left}) { background: #c5eddc; color: #102d25; } ::highlight(${names.right}) { background: #ffdac7; color: #512510; } ::highlight(${names.pending}) { background: #b9d6ff; color: #142f58; } ::highlight(${names.active}) { background: #e3d0ff; color: #30204b; text-decoration: underline; }`;
  root.append(style);
  container.replaceChildren(root);
  const text = canonicalText(surface);
  const listeners = new AbortController();
  let destroyed = false, precise = false, gesture = null, dialog = null, finishPromise = null;
  let focusedBlock = null;
  let initialized = false;
  const state = new ReviewSession({ ...options, text: text.text }, (name, detail) => {
    container.dispatchEvent(new CustomEvent(`review:${name}`, { detail }));
    if (initialized) paint();
  });
  initialized = true;
  const labels = state.labels;
  const left = labels.find(l => l.direction === 'left'), right = labels.find(l => l.direction === 'right');
  function guard() { if (destroyed) throw new Error('This annotator has been destroyed.'); }
  function announce(message) { status.textContent = message; }
  function error(err) {
    const message = err instanceof Error ? err.message : String(err);
    announce(message); container.dispatchEvent(new CustomEvent('review:error', { detail: { message } }));
  }
  function listen(node, type, handler, config = {}) { node.addEventListener(type, handler, { ...config, signal: listeners.signal }); }
  function safe(operation) { try { return operation(); } catch (err) { error(err); return undefined; } }

  function paint() {
    if (destroyed) return;
    const annotations = state.read();
    for (const direction of ['left', 'right']) {
      const label = labels.find(l => l.direction === direction);
      CSS.highlights.set(names[direction], new Highlight(...annotations.filter(a => a.labelId === label.id).map(a => text.range(a.start, a.end))));
    }
    const pending = state.pending;
    CSS.highlights.set(names.pending, new Highlight(...(pending ? [text.range(pending.start, pending.end)] : [])));
    const active = annotations.find(a => a.id === state.activeId);
    CSS.highlights.set(names.active, new Highlight(...(active ? [text.range(active.start, active.end)] : [])));
    count.textContent = `Annotations (${annotations.length})`;
    list.replaceChildren();
    for (const a of annotations) {
      const item = element('li'); const label = labels.find(l => l.id === a.labelId);
      const button = element('button', 'review-saved-item', `${label.name}: ${a.quote}`);
      button.type = 'button'; button.dataset.annotationId = a.id; button.setAttribute('aria-pressed', String(state.activeId === a.id));
      item.append(button); list.append(item);
    }
    mode.textContent = precise ? 'Precise selection · arrows move · Shift+arrows select · F2 keeps range · Escape cancels' : 'Read-only · F2 for precise keyboard selection';
    if (pending) announce(`Selected ${pending.quote.length} characters: ${pending.quote.slice(0, 100)}`);
    else if (active) announce(`Editing ${labels.find(l => l.id === active.labelId).name}: ${active.quote.slice(0, 100)}`);
  }

  function nativeRange() {
    const selection = getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    if (!surface.contains(range.startContainer) || !surface.contains(range.endContainer)) return null;
    return range;
  }
  function syncSelection() {
    if (destroyed || gesture?.swipe || dialog) return;
    const range = nativeRange();
    if (!range) return;
    const { start, end } = text.fromRange(range);
    if (start < end && (state.pending?.start !== start || state.pending?.end !== end)) state.select(start, end);
  }
  function resetNative() { if (nativeRange()) getSelection().removeAllRanges(); }
  function classify(label) {
    syncSelection();
    const saved = state.classify(label.id);
    if (saved) { precise = false; resetNative(); paint(); announce(`${label.name} assigned. ${state.read().length} saved annotations.`); }
    return !!saved;
  }
  function focusRange(annotation) {
    const range = text.range(annotation.start, annotation.end);
    const target = selectableBlock(range.startContainer.parentElement) ?? surface;
    target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'nearest' });
  }
  function activate(id) {
    state.activate(id); precise = false; resetNative();
    focusRange(state.read().find(a => a.id === id));
  }
  function navigateAnnotation(delta) {
    const annotations = state.read(); if (!annotations.length) return false;
    const index = annotations.findIndex(a => a.id === state.activeId);
    activate(annotations[(index < 0 ? (delta > 0 ? 0 : annotations.length - 1) : (index + delta + annotations.length) % annotations.length)].id);
    return true;
  }
  function moveBlock(delta) {
    if (!blocks.length) return false;
    const index = blocks.indexOf(focusedBlock);
    blocks[Math.max(0, Math.min(blocks.length - 1, index < 0 ? (delta > 0 ? 0 : blocks.length - 1) : index + delta))].focus();
    return true;
  }
  function selectBlock() {
    const block = surface.contains(document.activeElement) ? selectableBlock(document.activeElement) ?? focusedBlock : focusedBlock;
    if (!block) return moveBlock(1);
    if (!(block instanceof HTMLElement) || !surface.contains(block) || !block.matches(BLOCK_SELECTOR)) return false;
    const range = document.createRange(); range.selectNodeContents(block);
    const positions = text.fromRange(range);
    if (positions.start < positions.end) { state.select(positions.start, positions.end); resetNative(); }
    return true;
  }
  function togglePrecise() {
    if (precise) { syncSelection(); precise = false; paint(); return true; }
    const focused = document.activeElement;
    const block = (surface.contains(focused) ? selectableBlock(focused) : null) ?? focusedBlock ?? blocks[0];
    if (!block) return false;
    state.clear(); precise = true; block.focus();
    const range = document.createRange(); range.selectNodeContents(block); range.collapse(true);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    paint(); return true;
  }

  function closeDialog(value) { dialog?.close(value); }
  function openDialog(title, content) {
    if (dialog) return null;
    const previousFocus = document.activeElement;
    const modal = element('dialog', 'review-dialog');
    const heading = element('h2', '', title); heading.id = `${token}-dialog-title`;
    modal.setAttribute('aria-labelledby', heading.id); modal.append(heading, content);
    const dismiss = element('button', '', 'Cancel'); dismiss.type = 'button';
    dismiss.addEventListener('click', () => modal.close('cancel')); modal.append(dismiss);
    root.append(modal); dialog = modal;
    modal.addEventListener('close', () => {
      dialog = null; modal.remove();
      if (!destroyed && previousFocus?.isConnected) previousFocus.focus();
    }, { once: true });
    modal.addEventListener('cancel', event => { event.preventDefault(); modal.close('cancel'); });
    modal.addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const buttons = [...modal.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus(); event.preventDefault();
    });
    modal.showModal(); modal.querySelector('button')?.focus();
    return modal;
  }
  function chooseOverlap(annotations) {
    const content = element('div', 'review-choices');
    for (const a of annotations) {
      const button = element('button', '', `${labels.find(l => l.id === a.labelId).name}: ${a.quote}`);
      button.type = 'button'; button.addEventListener('click', () => { state.activate(a.id); closeDialog('selected'); }); content.append(button);
    }
    openDialog('Choose an annotation', content);
  }
  function showHelp() {
    const content = element('dl', 'review-shortcuts');
    for (const [command, keys] of Object.entries(shortcuts.effective)) content.append(element('dt', '', command), element('dd', '', keys.join(' / ')));
    content.append(element('dt', '', 'Native selection'), element('dd', '', 'Tab / Shift+Tab: normal focus. In F2 mode: arrows move; Shift+arrows select; Ctrl+Shift+Left/Right (Windows/Linux) or Option+Shift+Left/Right (macOS) extends by word.'));
    openDialog('Keyboard shortcuts', content); return true;
  }
  async function finish() {
    guard();
    if (finishPromise) return finishPromise;
    finishPromise = (async () => {
      syncSelection();
      if (state.pending) {
        const content = element('div', 'review-choices');
        for (const [value, title] of [['left', left.name], ['right', right.name], ['discard', 'Discard pending selection']]) {
          const button = element('button', '', title); button.type = 'button'; button.addEventListener('click', () => closeDialog(value)); content.append(button);
        }
        const modal = openDialog('Resolve pending selection', content);
        if (!modal) return null;
        const choice = await new Promise(resolve => modal.addEventListener('close', () => resolve(modal.returnValue), { once: true }));
        if (destroyed || !['left', 'right', 'discard'].includes(choice)) return null;
        if (choice === 'discard') { state.clear(); resetNative(); }
        else classify(choice === 'left' ? left : right);
      }
      const data = state.export(format);
      const revision = state.revision;
      try {
        await options.onFinish?.(structuredClone(data));
        if (!destroyed && (state.revision !== revision || state.pending)) throw new Error('The review changed while saving. Export again; all annotations are retained.');
      }
      catch (err) { error(err); throw err; }
      if (destroyed) return null;
      container.dispatchEvent(new CustomEvent('review:complete', { detail: structuredClone(data) }));
      announce('Review complete. Annotations remain available for export or retry.');
      return data;
    })();
    try { return await finishPromise; } finally { finishPromise = null; }
  }
  function command(name) {
    guard();
    if (name === 'left' || name === 'right') return classify(name === 'left' ? left : right);
    if (name === 'clear') {
      if (!precise && !state.pending && !state.activeId && !nativeRange()) return false;
      precise = false; state.clear(); resetNative(); paint(); announce('Selection cleared.'); return true; }
    if (name === 'remove') {
      if (state.pending) { state.clear(); resetNative(); announce('Pending selection discarded.'); }
      else if (state.activeId) { state.delete(state.activeId); surface.focus(); announce('Annotation deleted. Undo restores it.'); }
      return true;
    }
    if (name === 'undo' || name === 'redo') {
      const canceled = !!(precise || state.pending || state.activeId || nativeRange());
      precise = false; resetNative();
      const changed = state[name]();
      if (!canceled && !changed) return false;
      surface.focus(); paint(); announce(name === 'undo' ? 'Undone.' : 'Redone.'); return true;
    }
    if (name === 'nextBlock') return moveBlock(1);
    if (name === 'previousBlock') return moveBlock(-1);
    if (name === 'nextAnnotation') return navigateAnnotation(1);
    if (name === 'previousAnnotation') return navigateAnnotation(-1);
    if (name === 'selectBlock') return selectBlock();
    if (name === 'precise') return togglePrecise();
    if (name === 'help') return showHelp();
    if (name === 'finish') { void finish().catch(() => {}); return true; }
    if (name === 'export') {
      container.dispatchEvent(new CustomEvent('review:export', { detail: state.export(format) }));
      announce('Export ready. Pending selection remains excluded.'); return true;
    }
    return false;
  }

  for (const [name, title] of [['left', left.name], ['right', right.name], ['clear', 'Clear selection'], ['remove', 'Delete annotation'], ['undo', 'Undo'], ['redo', 'Redo'], ['previousBlock', 'Previous block'], ['nextBlock', 'Next block'], ['selectBlock', 'Select block'], ['precise', 'Precise selection'], ['previousAnnotation', 'Previous annotation'], ['nextAnnotation', 'Next annotation'], ['export', 'Export files'], ['finish', 'Done'], ['help', 'Shortcut help']]) {
    const button = element('button', `review-command review-${name}`, title); button.type = 'button'; button.dataset.command = name;
    button.title = `${title} (${shortcuts.effective[name].join(' / ')})`; button.setAttribute('aria-keyshortcuts', shortcuts.effective[name].join(' ').replaceAll('Mod', /Mac/.test(navigator.platform) ? 'Meta' : 'Control'));
    toolbar.append(button);
  }
  listen(toolbar, 'click', event => {
    const button = event.target.closest('[data-command]'); if (button) safe(() => command(button.dataset.command));
  });
  listen(list, 'click', event => { const button = event.target.closest('[data-annotation-id]'); if (button) safe(() => activate(button.dataset.annotationId)); });
  listen(document, 'selectionchange', () => safe(syncSelection));
  listen(surface, 'focusin', event => { const block = selectableBlock(event.target); if (block) focusedBlock = block; });
  listen(surface, 'click', event => { if (event.target.closest('a')) event.preventDefault(); });
  listen(surface, 'beforeinput', event => event.preventDefault());
  listen(surface, 'paste', event => event.preventDefault());
  listen(surface, 'cut', event => event.preventDefault());

  function pointAt(x, y) {
    const point = document.caretPositionFromPoint?.(x, y);
    if (point && surface.contains(point.offsetNode)) return text.offset(point.offsetNode, point.offset);
    const range = document.caretRangeFromPoint?.(x, y);
    if (range && surface.contains(range.startContainer)) return text.offset(range.startContainer, range.startOffset);
    return null;
  }
  function hitRange(anchor, x, y) {
    return [...text.range(anchor.start, anchor.end).getClientRects()].some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  }
  function cancelGesture() {
    gesture?.preview?.remove();
    if (gesture?.swipe && surface.hasPointerCapture?.(gesture.id)) surface.releasePointerCapture(gesture.id);
    gesture = null;
  }
  listen(surface, 'pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    const pending = state.pending;
    const swipe = !!pending && hitRange(pending, event.clientX, event.clientY);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, swipe, target: event.target };
    if (swipe) {
      event.preventDefault(); surface.setPointerCapture(event.pointerId);
      const preview = element('div', 'review-swipe-preview', pending.quote); preview.setAttribute('aria-hidden', 'true');
      root.append(preview); gesture.preview = preview;
    }
  });
  listen(surface, 'pointermove', event => {
    if (!gesture?.swipe || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const preview = gesture.preview;
    preview.hidden = Math.abs(dx) < 8;
    preview.textContent = `${dx < 0 ? left.name : right.name} · ${state.pending?.quote ?? ''}`;
    preview.style.left = `${Math.max(8, Math.min(innerWidth - 280, event.clientX + 12))}px`;
    preview.style.top = `${Math.max(8, Math.min(innerHeight - 100, event.clientY + 15))}px`;
  });
  listen(surface, 'pointerup', event => safe(() => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const current = gesture;
    const dx = event.clientX - current.x, dy = event.clientY - current.y;
    cancelGesture();
    if (current.swipe) {
      const direction = swipeDirection(dx, dy);
      if (direction) classify(direction === 'left' ? left : right);
      return;
    }
    if (nativeRange() || Math.hypot(dx, dy) > 4) { syncSelection(); return; }
    const at = pointAt(event.clientX, event.clientY);
    const saved = at === null ? [] : state.read().filter(a => at >= a.start && at < a.end && hitRange(a, event.clientX, event.clientY));
    resetNative(); precise = false;
    if (saved.length > 1) { chooseOverlap(saved); return; }
    if (saved.length === 1) { activate(saved[0].id); return; }
    const block = selectableBlock(current.target);
    if (block && surface.contains(block)) { block.focus({ preventScroll: true }); selectBlock(); }
    else state.clear();
  }));
  listen(surface, 'pointercancel', cancelGesture);
  listen(surface, 'lostpointercapture', cancelGesture);
  listen(document, 'pointerup', event => { if (gesture && !gesture.swipe && !surface.contains(event.target)) { syncSelection(); cancelGesture(); } });
  listen(document, 'pointerdown', event => { if (!root.contains(event.target)) { state.clear(); precise = false; cancelGesture(); } });
  listen(root, 'keydown', event => {
    if (event.isComposing || event.target.isContentEditable || event.target.closest('input,textarea,select')) return;
    if (dialog) return;
    if (event.key === 'Escape' && gesture?.swipe) { event.preventDefault(); cancelGesture(); return; }
    if (precise && surface.contains(event.target) && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const selection = getSelection();
      const old = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
      const backward = ['ArrowLeft', 'ArrowUp'].includes(event.key);
      const word = /Mac/.test(navigator.platform) ? event.altKey : event.ctrlKey;
      selection.modify(event.shiftKey ? 'extend' : 'move', backward ? 'backward' : 'forward', word ? 'word' : ['ArrowUp', 'ArrowDown'].includes(event.key) ? 'line' : 'character');
      if ((!surface.contains(selection.anchorNode) || !surface.contains(selection.focusNode)) && old) { selection.removeAllRanges(); selection.addRange(old); }
      if (selection.isCollapsed) state.clear(); else safe(syncSelection);
      return;
    }
    const name = shortcuts.command(event);
    if (!name || (name === 'selectBlock' && event.target.closest('button,a'))) return;
    if (safe(() => command(name))) event.preventDefault();
  });
  paint();
  return {
    select(start, end) { guard(); state.anchor(start, end); resetNative(); return state.select(start, end); },
    clear() { guard(); return command('clear'); },
    activate(id) { guard(); return activate(id); },
    relabel(id, labelId) { guard(); return state.relabel(id, labelId); },
    delete(id) { guard(); return state.delete(id); },
    read() { guard(); return state.read(); },
    restore(payload) { guard(); state.restore(payload); precise = false; resetNative(); paint(); },
    undo() { guard(); resetNative(); return state.undo(); },
    redo() { guard(); resetNative(); return state.redo(); },
    export(exportFormat = format) { guard(); return state.export(exportFormat); },
    finish,
    get shortcuts() { return structuredClone(shortcuts.effective); },
    destroy() {
      if (destroyed) return;
      destroyed = true; listeners.abort(); cancelGesture(); dialog?.close('cancel');
      for (const name of Object.values(names)) CSS.highlights.delete(name);
      if (nativeRange()) getSelection().removeAllRanges();
      container.replaceChildren(...original);
    },
  };
}
