# 19 — Mobile native selection and swipe

Status: planned, not implemented. Depends on: 17; reuse shared classification and safety verified in 18. New mobile support work, not evidence supplied by 07.

## Outcome

On supported mobile browsers, select/adjust text using native controls and deliberately assign either label without breaking scrolling, zoom or selection handles.

## Prototype contract

- Check actual CSS Highlight, Range/Selection and precise-keyboard capabilities on target iOS Safari and Android Chrome before declaring support. Do not bypass the current mount guard or silently advertise unavailable keyboard functionality. Resolve any capability split explicitly before implementation.
- Preserve native long press, range handles, vertical scrolling, pinch zoom and OS/browser edge navigation. Do not globally disable selection or apply horizontal-gesture ownership to all document text.
- Do not infer mobile behavior from desktop `wheel` input. Mouse/trackpad attached to a mobile device follows its actual input/capability path, not a user-agent guess.
- UX prototype: a compact, clearly associated pending-selection summary/action area that can receive a natural horizontal touch swipe, separate from native text-selection handles. This is **a proposal to validate**, not an adopted desktop drag handle or an approved final mobile layout. Keep click/tap label buttons available.
- The area stays within the mounted widget, names both host-defined labels and represents the entire pending range. Long quotes may use a bounded excerpt/count; no fragmented annotations or giant floating copy. It must remain reachable for selections at the start/middle/end of a long document, in portrait/landscape and at zoom, without obscuring text/handles or browser edge gestures.
- Let native browser touch routing own scroll/pinch cancellation. Check inherited `touch-action` restrictions; declare the narrow action area's policy before contact. Prototype `pan-y pinch-zoom` there and native document behavior (`auto`), rather than attempting to reclaim a stream after the browser owns it. This CSS is a test candidate, not proof of compatibility.
- If a safe, discoverable touch origin cannot coexist with native range editing, stop and revise the prototype. Do not ship custom selection handles or copy the rejected desktop dragged-text workflow as a requirement.

## Classification safety

One owning pointer/contact and immutable pending anchor; same shared classification path as buttons. Native cancellation, added contacts/pinch, capture loss, changed range, orientation/viewport changes, backgrounding, completion/restore and destruction cannot commit stale text. Pointer-specific cleanup must not let unrelated events retarget a gesture. A successful action commits once; canceled action retains the exact pending selection. Readiness/commit feedback must agree for the chosen touch behavior.

## Proof

Real iPhone Safari and Android Chrome: tap block/list/code; long-press exact text; adjust both handles across inline markup/blocks; scroll starting on highlighted text; pinch; both label directions; insufficient/reversed swipe; added finger; rotation/backgrounding; safe-area/zoom layout; label buttons and accessible names/state; Undo/Redo/export/restore. Include long and overlapping selections and both themes. Touch emulation covers event routing only.

## Done

- [ ] Mobile UX/capability prototype passes native selection, scrolling and first-use checks.
- [ ] Focused regression tests and integration pass without changing canonical text or public data contracts.
- [ ] Physical-device results and supported versions recorded in 20; no mobile-support claim before that gate.
