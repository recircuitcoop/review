import { ReviewSession, validateOptions } from './model.js';
import { canonicalText } from './text.js';
import { applyReviewStyles } from './styles.js';
import { shortcutMap } from './shortcuts.js';
import { BLOCK_SELECTOR, element, highlightNames, highlightStyle, paintHighlights, renderMarkdown, renderSavedList, selectableBlock } from './render.js';
import { choiceList, createDialogs, shortcutHelp } from './dialogs.js';
import { installPointerInput } from './pointer.js';
export { defaultReviewStyles } from './styles.js';

// Toolbar order; each button dispatches the same command as its shortcut.
const TOOLBAR = [
  ['left', null],
  ['right', null],
  ['clear', 'Clear selection'],
  ['remove', 'Delete annotation'],
  ['undo', 'Undo'],
  ['redo', 'Redo'],
  ['previousBlock', 'Previous block'],
  ['nextBlock', 'Next block'],
  ['selectBlock', 'Select block'],
  ['precise', 'Precise selection'],
  ['previousAnnotation', 'Previous annotation'],
  ['nextAnnotation', 'Next annotation'],
  ['export', 'Export files'],
  ['finish', 'Done'],
  ['help', 'Shortcut help'],
];
const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const READ_ONLY_MODE = 'Read-only · F2 for precise keyboard selection';
const PRECISE_MODE = 'Precise selection · arrows move · Shift+arrows select · F2 keeps range · Escape cancels';

function checkMountInput(container, options) {
  if (!(container instanceof HTMLElement)) throw new Error('Mount needs an HTML container.');
  validateOptions(options);
  if (typeof options.document.markdown !== 'string') throw new Error('Markdown source must be a string.');
  if (!globalThis.CSS?.highlights || !globalThis.Highlight || !getSelection()?.modify) {
    throw new Error('This browser needs CSS Custom Highlight and Selection.modify support. Use a current desktop browser.');
  }
}

/** Mount a local, read-only annotator. Host persistence and downloads remain outside the library. */
export function mountReview(container, options) {
  // Validate everything before touching host content.
  checkMountInput(container, options);
  const shortcuts = shortcutMap(options.shortcuts);
  const format = options.exportFormat ?? 'grouped';
  if (!['grouped', 'split'].includes(format)) throw new Error('Export format must be grouped or split.');

  // --- DOM ---------------------------------------------------------------
  const original = [...container.childNodes];
  const root = element('section', 'review');
  root.setAttribute('aria-label', 'Document annotator');
  applyReviewStyles(root, options.styles);
  const toolbar = element('div', 'review-toolbar');
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Annotation controls');
  const surface = element('article', 'review-document');
  surface.tabIndex = 0;
  surface.setAttribute('aria-label', 'Read-only document');
  const blocks = renderMarkdown(surface, options.document.markdown);
  const layout = element('div', 'review-layout');
  const sidebar = element('aside', 'review-saved');
  sidebar.setAttribute('aria-label', 'Saved annotations');
  const list = element('ol', 'review-annotation-list');
  const count = element('h2', '', 'Annotations (0)');
  sidebar.append(count, list);
  const status = element('p', 'review-status', 'Click a paragraph, heading, list item, or code block; or drag an exact range.');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const mode = element('p', 'review-mode', READ_ONLY_MODE);
  layout.append(surface, sidebar);
  root.append(toolbar, mode, layout, status);
  const token = `review-${crypto.randomUUID()}`;
  const names = highlightNames(token);
  const style = element('style');
  style.textContent = highlightStyle(names);
  root.append(style);
  container.replaceChildren(root);

  // --- State -------------------------------------------------------------
  // Canonical text is computed once from the rendered DOM; offsets never depend on layout.
  const text = canonicalText(surface);
  const listeners = new AbortController();
  let destroyed = false;
  let precise = false;
  let finishPromise = null;
  let focusedBlock = null;
  let initialized = false;
  const state = new ReviewSession({ ...options, text: text.text }, (name, detail) => {
    container.dispatchEvent(new CustomEvent(`review:${name}`, { detail }));
    // The constructor emits nothing, but paint() needs everything below to exist.
    if (initialized) paint();
  });
  initialized = true;
  const labels = state.labels;
  const left = labels.find(l => l.direction === 'left');
  const right = labels.find(l => l.direction === 'right');
  const dialogs = createDialogs(root, token, () => destroyed);

  function guard() {
    if (destroyed) throw new Error('This annotator has been destroyed.');
  }
  function announce(message) {
    status.textContent = message;
  }
  function error(err) {
    const message = err instanceof Error ? err.message : String(err);
    announce(message);
    container.dispatchEvent(new CustomEvent('review:error', { detail: { message } }));
  }
  function listen(node, type, handler, config = {}) {
    node.addEventListener(type, handler, { ...config, signal: listeners.signal });
  }
  // UI handlers report failures as review:error instead of throwing into the browser.
  function safe(operation) {
    try {
      return operation();
    } catch (err) {
      error(err);
      return undefined;
    }
  }
  function labelName(labelId) {
    return labels.find(l => l.id === labelId).name;
  }

  // --- Painting ----------------------------------------------------------
  function paint() {
    if (destroyed) return;
    const annotations = state.read();
    const pending = state.pending;
    const active = annotations.find(a => a.id === state.activeId);
    paintHighlights({ names, text, labels, annotations, pending, active });
    renderSavedList({ list, count, labels, annotations, activeId: state.activeId });
    mode.textContent = precise ? PRECISE_MODE : READ_ONLY_MODE;
    if (pending) announce(`Selected ${pending.quote.length} characters: ${pending.quote.slice(0, 100)}`);
    else if (active) announce(`Editing ${labelName(active.labelId)}: ${active.quote.slice(0, 100)}`);
  }

  // --- Native selection ---------------------------------------------------
  /** The browser selection, only when it is a nonempty range inside the document surface. */
  function nativeRange() {
    const selection = getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    if (!surface.contains(range.startContainer) || !surface.contains(range.endContainer)) return null;
    return range;
  }
  /** Mirror the native range into the pending selection. Swipes and dialogs freeze it. */
  function syncSelection() {
    if (destroyed || pointer.isSwiping() || dialogs.isOpen) return;
    const range = nativeRange();
    if (!range) return;
    const { start, end } = text.fromRange(range);
    const unchanged = state.pending?.start === start && state.pending?.end === end;
    if (start < end && !unchanged) state.select(start, end);
  }
  function resetNative() {
    if (nativeRange()) getSelection().removeAllRanges();
  }

  // --- Operations shared by buttons, keys and pointer ----------------------
  /** The single commit path: assigns the label to the pending range or relabels the active annotation. */
  function classify(label) {
    syncSelection();
    const saved = state.classify(label.id);
    if (!saved) return false;
    precise = false;
    resetNative();
    paint();
    announce(`${label.name} assigned. ${state.read().length} saved annotations.`);
    return true;
  }
  function focusRange(annotation) {
    const range = text.range(annotation.start, annotation.end);
    const target = selectableBlock(range.startContainer.parentElement) ?? surface;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest' });
  }
  function activate(id) {
    state.activate(id);
    precise = false;
    resetNative();
    focusRange(state.read().find(a => a.id === id));
  }
  /** Cycle through saved annotations in document order, wrapping at both ends. */
  function navigateAnnotation(delta) {
    const annotations = state.read();
    if (!annotations.length) return false;
    const index = annotations.findIndex(a => a.id === state.activeId);
    let next;
    if (index < 0) next = delta > 0 ? 0 : annotations.length - 1;
    else next = (index + delta + annotations.length) % annotations.length;
    activate(annotations[next].id);
    return true;
  }
  /** Move focus between blocks, clamping at both ends. */
  function moveBlock(delta) {
    if (!blocks.length) return false;
    const index = blocks.indexOf(focusedBlock);
    let next;
    if (index < 0) next = delta > 0 ? 0 : blocks.length - 1;
    else next = Math.max(0, Math.min(blocks.length - 1, index + delta));
    blocks[next].focus();
    return true;
  }
  function selectBlock() {
    const focusedInside = surface.contains(document.activeElement);
    const block = focusedInside ? selectableBlock(document.activeElement) ?? focusedBlock : focusedBlock;
    // No block yet: the first Enter focuses one instead of selecting.
    if (!block) return moveBlock(1);
    if (!(block instanceof HTMLElement) || !surface.contains(block) || !block.matches(BLOCK_SELECTOR)) return false;
    const range = document.createRange();
    range.selectNodeContents(block);
    const positions = text.fromRange(range);
    if (positions.start < positions.end) {
      state.select(positions.start, positions.end);
      resetNative();
    }
    return true;
  }
  /** F2 toggles a caret inside the read-only document; leaving keeps the range as pending. */
  function togglePrecise() {
    if (precise) {
      syncSelection();
      precise = false;
      paint();
      return true;
    }
    const focused = document.activeElement;
    const block = (surface.contains(focused) ? selectableBlock(focused) : null) ?? focusedBlock ?? blocks[0];
    if (!block) return false;
    state.clear();
    precise = true;
    block.focus();
    const range = document.createRange();
    range.selectNodeContents(block);
    range.collapse(true);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    paint();
    return true;
  }
  function chooseOverlap(annotations) {
    const choices = annotations.map(a => ({
      title: `${labelName(a.labelId)}: ${a.quote}`,
      onChoose: () => {
        state.activate(a.id);
        dialogs.close('selected');
      },
    }));
    dialogs.open('Choose an annotation', choiceList(choices));
  }
  function showHelp() {
    dialogs.open('Keyboard shortcuts', shortcutHelp(shortcuts.display));
    return true;
  }

  // --- Completion ---------------------------------------------------------
  /** Ask the user to label or discard a pending range. Resolves false when canceled. */
  async function resolvePending() {
    const choices = [['left', left.name], ['right', right.name], ['discard', 'Discard pending selection']].map(([value, title]) => ({
      title,
      onChoose: () => dialogs.close(value),
    }));
    const modal = dialogs.open('Resolve pending selection', choiceList(choices));
    if (!modal) return false;
    const choice = await new Promise(resolve => modal.addEventListener('close', () => resolve(modal.returnValue), { once: true }));
    if (destroyed || !['left', 'right', 'discard'].includes(choice)) return false;
    if (choice === 'discard') {
      state.clear();
      resetNative();
    } else {
      classify(choice === 'left' ? left : right);
    }
    return true;
  }
  async function runFinish() {
    syncSelection();
    if (state.pending && !(await resolvePending())) return null;
    const data = state.export(format);
    const revision = state.revision;
    try {
      await options.onFinish?.(structuredClone(data));
      // Never report completion for data that changed while the host was saving.
      if (!destroyed && (state.revision !== revision || state.pending)) {
        throw new Error('The review changed while saving. Export again; all annotations are retained.');
      }
    } catch (err) {
      error(err);
      throw err;
    }
    if (destroyed) return null;
    container.dispatchEvent(new CustomEvent('review:complete', { detail: structuredClone(data) }));
    announce('Review complete. Annotations remain available for export or retry.');
    return data;
  }
  /** Done: resolve pending text, save through the host, then emit review:complete. Concurrent calls share one run. */
  async function finish() {
    guard();
    if (finishPromise) return finishPromise;
    finishPromise = runFinish();
    try {
      return await finishPromise;
    } finally {
      finishPromise = null;
    }
  }

  // --- Commands -----------------------------------------------------------
  // Each handler returns true when it applied, so the keyboard path knows whether to preventDefault.
  const commands = {
    left: () => classify(left),
    right: () => classify(right),
    clear() {
      if (!precise && !state.pending && !state.activeId && !nativeRange()) return false;
      precise = false;
      state.clear();
      resetNative();
      paint();
      announce('Selection cleared.');
      return true;
    },
    remove() {
      if (state.pending) {
        state.clear();
        resetNative();
        announce('Pending selection discarded.');
      } else if (state.activeId) {
        state.delete(state.activeId);
        surface.focus();
        announce('Annotation deleted. Undo restores it.');
      }
      return true;
    },
    undo: () => travel('undo'),
    redo: () => travel('redo'),
    nextBlock: () => moveBlock(1),
    previousBlock: () => moveBlock(-1),
    nextAnnotation: () => navigateAnnotation(1),
    previousAnnotation: () => navigateAnnotation(-1),
    selectBlock,
    precise: togglePrecise,
    help: showHelp,
    finish() {
      void finish().catch(() => {});
      return true;
    },
    export() {
      container.dispatchEvent(new CustomEvent('review:export', { detail: state.export(format) }));
      announce('Export ready. Pending selection remains excluded.');
      return true;
    },
  };
  /** Undo/redo also cancel any selection; they count as applied if either happened. */
  function travel(direction) {
    const canceled = !!(precise || state.pending || state.activeId || nativeRange());
    precise = false;
    resetNative();
    const changed = state[direction]();
    if (!canceled && !changed) return false;
    surface.focus();
    paint();
    announce(direction === 'undo' ? 'Undone.' : 'Redone.');
    return true;
  }
  function command(name) {
    guard();
    if (!Object.hasOwn(commands, name)) return false;
    return commands[name]();
  }

  // --- Toolbar and sidebar --------------------------------------------------
  for (const [name, fixedTitle] of TOOLBAR) {
    const title = fixedTitle ?? (name === 'left' ? left.name : right.name);
    const button = element('button', `review-command review-${name}`, title);
    button.type = 'button';
    button.dataset.command = name;
    button.title = `${title} (${shortcuts.display[name].join(' / ')})`;
    const aria = shortcuts.effective[name].join(' ')
      .replace(/\bmod\b/gi, /Mac/.test(navigator.platform) ? 'Meta' : 'Control')
      .replace(/\bctrl\b/gi, 'Control');
    button.setAttribute('aria-keyshortcuts', aria);
    toolbar.append(button);
  }
  listen(toolbar, 'click', event => {
    const button = event.target.closest('[data-command]');
    if (button) safe(() => command(button.dataset.command));
  });
  listen(list, 'click', event => {
    const button = event.target.closest('[data-annotation-id]');
    if (button) safe(() => activate(button.dataset.annotationId));
  });

  // --- Document surface ---------------------------------------------------
  listen(document, 'selectionchange', () => safe(syncSelection));
  listen(surface, 'focusin', event => {
    const block = selectableBlock(event.target);
    if (block) focusedBlock = block;
  });
  // Read-only: links do not navigate and editing input is refused.
  listen(surface, 'click', event => {
    if (event.target.closest('a')) event.preventDefault();
  });
  listen(surface, 'beforeinput', event => event.preventDefault());
  listen(surface, 'paste', event => event.preventDefault());
  listen(surface, 'cut', event => event.preventDefault());

  const pointer = installPointerInput({
    surface,
    root,
    text,
    state,
    left,
    right,
    listen,
    safe,
    classify,
    syncSelection,
    nativeRange,
    resetNative,
    exitPrecise() {
      precise = false;
    },
    chooseOverlap,
    activate,
    selectBlock,
  });
  listen(document, 'pointerdown', event => {
    if (root.contains(event.target)) return;
    state.clear();
    precise = false;
    pointer.cancel();
  });

  // --- Keyboard -------------------------------------------------------------
  /** Precise mode: arrows move or extend a caret, never leaving the document surface. */
  function movePreciseCaret(event) {
    event.preventDefault();
    const selection = getSelection();
    const previous = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown';
    // Word steps use Alt on macOS and Ctrl elsewhere, like native text fields.
    const byWord = /Mac/.test(navigator.platform) ? event.altKey : event.ctrlKey;
    const granularity = byWord ? 'word' : vertical ? 'line' : 'character';
    selection.modify(event.shiftKey ? 'extend' : 'move', backward ? 'backward' : 'forward', granularity);
    const escaped = !surface.contains(selection.anchorNode) || !surface.contains(selection.focusNode);
    if (escaped && previous) {
      selection.removeAllRanges();
      selection.addRange(previous);
    }
    if (selection.isCollapsed) {
      state.clear();
      return;
    }
    safe(syncSelection);
  }
  listen(root, 'keydown', event => {
    // Editable fields, IME composition and open dialogs keep their own keys.
    if (event.isComposing || event.target.isContentEditable || event.target.closest('input,textarea,select')) return;
    if (dialogs.isOpen) return;
    if (event.key === 'Escape' && pointer.isSwiping()) {
      event.preventDefault();
      pointer.cancel();
      return;
    }
    if (precise && surface.contains(event.target) && ARROW_KEYS.includes(event.key)) {
      movePreciseCaret(event);
      return;
    }
    const name = shortcuts.command(event);
    if (!name) return;
    // Enter on a native button or link keeps its native activation.
    if (name === 'selectBlock' && event.target.closest('button,a')) return;
    if (safe(() => command(name))) event.preventDefault();
  });

  paint();

  // --- Public handle ----------------------------------------------------------
  return {
    select(start, end) {
      guard();
      state.anchor(start, end);
      resetNative();
      return state.select(start, end);
    },
    clear() {
      guard();
      return command('clear');
    },
    activate(id) {
      guard();
      return activate(id);
    },
    relabel(id, labelId) {
      guard();
      return state.relabel(id, labelId);
    },
    delete(id) {
      guard();
      return state.delete(id);
    },
    read() {
      guard();
      return state.read();
    },
    restore(payload) {
      guard();
      state.restore(payload);
      precise = false;
      resetNative();
      paint();
    },
    undo() {
      guard();
      resetNative();
      return state.undo();
    },
    redo() {
      guard();
      resetNative();
      return state.redo();
    },
    export(exportFormat = format) {
      guard();
      return state.export(exportFormat);
    },
    finish,
    get shortcuts() {
      return structuredClone(shortcuts.effective);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.abort();
      pointer.cancel();
      dialogs.close('cancel');
      for (const name of Object.values(names)) CSS.highlights.delete(name);
      if (nativeRange()) getSelection().removeAllRanges();
      container.replaceChildren(...original);
    },
  };
}
