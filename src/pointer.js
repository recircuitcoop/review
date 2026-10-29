import { selectableBlock } from './render.js';

/**
 * Pointer-device input on the document surface: click-to-select blocks, clicks on
 * saved highlights, and native horizontal scrolling over the pending range.
 * Pointer presses never label; drags stay native text selection.
 * The annotator supplies shared operations through `ctx`, so a wheel label commits
 * through the same `classify` path as buttons and keys.
 */
export function installPointerInput(ctx) {
  const { surface, text, state, left, right, dialogs, listen, safe } = ctx;
  // The primary press in progress, kept only to tell a click from a drag on release.
  let press = null;

  function pointAt(x, y) {
    const point = document.caretPositionFromPoint?.(x, y);
    if (point && surface.contains(point.offsetNode)) return text.offset(point.offsetNode, point.offset);
    const range = document.caretRangeFromPoint?.(x, y);
    if (range && surface.contains(range.startContainer)) return text.offset(range.startContainer, range.startOffset);
    return null;
  }

  /** Whether a viewport point lies on the rendered rectangles of a text range, read now. */
  function hitRange(anchor, x, y) {
    const rectangles = [...text.range(anchor.start, anchor.end).getClientRects()];
    return rectangles.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  }

  // No preventDefault or capture: a press on pending text starts native text selection.
  listen(surface, 'pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, target: event.target };
  });

  listen(surface, 'pointerup', event => safe(() => {
    if (!press || press.id !== event.pointerId) return;
    const current = press;
    press = null;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    // A drag (even one pixel that produced a native range) keeps its exact range.
    if (ctx.nativeRange() || Math.hypot(dx, dy) > 4) {
      ctx.syncSelection();
      return;
    }
    const at = pointAt(event.clientX, event.clientY);
    const saved = at === null ? [] : state.read().filter(a => at >= a.start && at < a.end && hitRange(a, event.clientX, event.clientY));
    ctx.resetNative();
    ctx.exitPrecise();
    if (saved.length > 1) {
      ctx.chooseOverlap(saved);
      return;
    }
    if (saved.length === 1) {
      ctx.activate(saved[0].id);
      return;
    }
    const block = selectableBlock(current.target);
    if (block && surface.contains(block)) {
      block.focus({ preventScroll: true });
      ctx.selectBlock();
      return;
    }
    state.clear();
  }));

  listen(surface, 'pointercancel', () => {
    press = null;
  });
  // A drag that leaves the surface still produces its native range on release.
  listen(document, 'pointerup', event => {
    if (!press || surface.contains(event.target)) return;
    press = null;
    ctx.syncSelection();
  });

  // Plan 25 trigger rule: browser-reported pure horizontal scrolling over the pending
  // highlight labels it once. Passive and never canceled, so native scrolling, zoom and
  // navigation stay untouched. A commit clears pending, so the rest of the stream does nothing.
  listen(surface, 'wheel', event => safe(() => {
    // Mixed-axis input fails closed; no axis ratio or thresholds.
    if (event.deltaX === 0 || event.deltaY !== 0) return;
    // Ctrl/Meta wheel is a zoom chord.
    if (event.ctrlKey || event.metaKey) return;
    if (dialogs.isOpen) return;
    // Mirror any native range first so the hit test uses the current pending target.
    ctx.syncSelection();
    const pending = state.pending;
    // Without a pending range classify would relabel an active saved annotation; wheel never does.
    if (!pending) return;
    if (!hitRange(pending, event.clientX, event.clientY)) return;
    ctx.classify(event.deltaX < 0 ? left : right);
  }), { passive: true });
}
