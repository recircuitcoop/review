import { swipeDirection } from './gesture.js';
import { element, selectableBlock } from './render.js';

/**
 * Pointer input on the document surface: swipe classification of the pending
 * range, click-to-select blocks, and clicks on saved highlights.
 * The annotator supplies shared operations through `ctx`, so a swipe commits
 * through the same `classify` path as buttons and keys.
 * Returns `cancel()` and `isSwiping()` for the annotator's lifecycle and keyboard.
 */
export function installPointerInput(ctx) {
  const { surface, root, text, state, left, right, listen, safe } = ctx;
  let gesture = null;

  function pointAt(x, y) {
    const point = document.caretPositionFromPoint?.(x, y);
    if (point && surface.contains(point.offsetNode)) return text.offset(point.offsetNode, point.offset);
    const range = document.caretRangeFromPoint?.(x, y);
    if (range && surface.contains(range.startContainer)) return text.offset(range.startContainer, range.startOffset);
    return null;
  }

  /** Whether a viewport point lies on the rendered rectangles of a text range. */
  function hitRange(anchor, x, y) {
    const rectangles = [...text.range(anchor.start, anchor.end).getClientRects()];
    return rectangles.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  }

  function cancel() {
    gesture?.preview?.remove();
    if (gesture?.swipe && surface.hasPointerCapture?.(gesture.id)) surface.releasePointerCapture(gesture.id);
    gesture = null;
  }

  listen(surface, 'pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    const pending = state.pending;
    // Only a press on the pending highlight starts a swipe; anything else is a click or native drag.
    const swipe = !!pending && hitRange(pending, event.clientX, event.clientY);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, swipe, target: event.target };
    if (!swipe) return;
    event.preventDefault();
    surface.setPointerCapture(event.pointerId);
    const preview = element('div', 'review-swipe-preview', pending.quote);
    preview.setAttribute('aria-hidden', 'true');
    root.append(preview);
    gesture.preview = preview;
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
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    cancel();
    if (current.swipe) {
      // Final displacement decides; a reversed or short swipe keeps the pending range.
      const direction = swipeDirection(dx, dy);
      if (direction) ctx.classify(direction === 'left' ? left : right);
      return;
    }
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

  listen(surface, 'pointercancel', cancel);
  listen(surface, 'lostpointercapture', cancel);
  // A drag that leaves the surface still produces its native range on release.
  listen(document, 'pointerup', event => {
    if (!gesture || gesture.swipe || surface.contains(event.target)) return;
    ctx.syncSelection();
    cancel();
  });

  return {
    cancel,
    isSwiping() {
      return !!gesture?.swipe;
    },
  };
}
