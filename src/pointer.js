import { selectableBlock } from './render.js';

// Implementation tuning (plan 26): wheel events of one swipe or momentum stream arrive about a
// frame apart, far inside this gap; a deliberate new select-then-swipe takes longer.
const CONTINUATION_GAP_MS = 200;

/**
 * Pointer-device input on the document surface: click-to-select scopes, Shift-append,
 * clicks on saved highlights, and native horizontal scrolling over pending ranges.
 * Pointer presses never label; drags stay native text selection.
 * The annotator supplies shared operations through `ctx`, so a wheel label commits
 * through the same `classify` path as buttons and keys.
 */
export function installPointerInput(ctx) {
  const { surface, text, state, left, right, dialogs, listen, safe } = ctx;
  // The primary press in progress, kept only to tell a click from a drag on release.
  let press = null;
  // When the last wheel event of a labeling gesture was canceled.
  let lastCanceled = -Infinity;

  /** The DOM caret position under a viewport point, inside the surface, or null. */
  function caretAt(x, y) {
    const point = document.caretPositionFromPoint?.(x, y);
    if (point && surface.contains(point.offsetNode)) return { node: point.offsetNode, offset: point.offset };
    const range = document.caretRangeFromPoint?.(x, y);
    if (range && surface.contains(range.startContainer)) return { node: range.startContainer, offset: range.startOffset };
    return null;
  }

  function pointAt(x, y) {
    const caret = caretAt(x, y);
    return caret ? text.offset(caret.node, caret.offset) : null;
  }

  /** Whether a viewport point lies on the rendered rectangles of a text range, read now. */
  function hitRange(anchor, x, y) {
    const rectangles = [...text.range(anchor.start, anchor.end).getClientRects()];
    return rectangles.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  }

  // No preventDefault or capture: a press on pending text starts native text selection.
  listen(surface, 'pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, target: event.target, shift: event.shiftKey };
    if (!event.shiftKey) return;
    // Shift+press would extend the old native selection into one spanning range. Collapse it
    // at the press point instead, so a Shift+drag selects exactly from here.
    const caret = caretAt(event.clientX, event.clientY);
    if (caret) getSelection().collapse(caret.node, caret.offset);
    else getSelection().removeAllRanges();
  });

  listen(surface, 'pointerup', event => safe(() => {
    if (!press || press.id !== event.pointerId) return;
    const current = press;
    press = null;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    // A drag (even one pixel that produced a native range) keeps its exact range.
    if (ctx.nativeRange() || Math.hypot(dx, dy) > 4) {
      if (current.shift) ctx.appendNative();
      else ctx.syncSelection();
      return;
    }
    ctx.resetNative();
    ctx.exitPrecise();
    // Shift+click always appends the clicked scope; saved-highlight precedence is for plain clicks.
    if (!current.shift) {
      const at = pointAt(event.clientX, event.clientY);
      const saved = at === null ? [] : state.read().filter(a => at >= a.start && at < a.end && hitRange(a, event.clientX, event.clientY));
      if (saved.length > 1) {
        ctx.chooseOverlap(saved);
        return;
      }
      if (saved.length === 1) {
        ctx.activate(saved[0].id);
        return;
      }
    }
    const block = selectableBlock(current.target);
    if (block && surface.contains(block)) {
      block.focus({ preventScroll: true });
      ctx.selectBlock(current.shift);
      return;
    }
    if (!current.shift) state.clear();
  }));

  listen(surface, 'pointercancel', () => {
    press = null;
  });
  // A drag that leaves the surface still produces its native range on release.
  listen(document, 'pointerup', event => safe(() => {
    if (!press || surface.contains(event.target)) return;
    const current = press;
    press = null;
    if (current.shift) ctx.appendNative();
    else ctx.syncSelection();
  }));

  // Plan 25 trigger rule with plan 26 cancellation: browser-reported pure horizontal scrolling
  // over a pending range labels every pending range once. That event and the rest of its
  // gesture are canceled so the browser's back/forward history swipe cannot also run.
  // Everything else (vertical, mixed, zoom, unrelated horizontal) is left to the browser.
  listen(surface, 'wheel', event => safe(() => {
    // Mixed-axis input fails closed; no axis ratio or thresholds.
    if (event.deltaX === 0 || event.deltaY !== 0) return;
    // Ctrl/Meta wheel is a zoom chord.
    if (event.ctrlKey || event.metaKey) return;
    // The rest of a gesture that already labeled: cancel it, never commit again, so late
    // momentum cannot label a selection made after the commit.
    if (event.timeStamp - lastCanceled < CONTINUATION_GAP_MS) {
      event.preventDefault();
      lastCanceled = event.timeStamp;
      return;
    }
    if (dialogs.isOpen) return;
    // Mirror any native range first so the hit test uses the current pending target.
    ctx.syncSelection();
    // Without a pending range classify would relabel an active saved annotation; wheel never does.
    const ranges = state.pendingRanges;
    if (!ranges.some(range => hitRange(range, event.clientX, event.clientY))) return;
    event.preventDefault();
    lastCanceled = event.timeStamp;
    ctx.classify(event.deltaX < 0 ? left : right);
  }), { passive: false });
}
