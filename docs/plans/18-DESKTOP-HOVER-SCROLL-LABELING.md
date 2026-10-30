# 18 — Desktop hover and horizontal scroll

Status: implemented under [25](25-ASSESSMENT-REMEDIATION.md) slice 3 (user-directed, ahead of 17's study), with the trigger rule recorded there; native desktop acceptance open. Depends on: 17. Reopens desktop gesture UX from 07; verification feeds 13 and 20.

## Outcome

A native horizontal scroll while hovering pending selected text assigns the configured left/right label once. Mouse/trackpad dragging remains native text selection.

## Contract

- Consume the browser's reported horizontal input as established in 17. Only exact pending-highlight hit rectangles qualify; hovering an entire paragraph/widget, saved annotation or empty area does not qualify. A saved target is never implicitly relabeled by scrolling.
- No custom diagonal classifier, reuse of the pointer 60px/1.5× thresholds, vertical-to-horizontal conversion, required modifier, dragged-text control, or mandatory confirmation click. Leave native vertical scrolling, zoom and browser navigation alone; do not call `preventDefault()` on wheel events to fake per-axis handling.
- Use the same classification command/state/history as label buttons. Synchronize and validate the pending range before the action; commit its exact quote/anchors or cancel if the target changed. Clear pending state after success; subsequent events without a pending range do nothing.
- Remove the desktop pointer-drag classification conflict: an exact selection drag, including one beginning on highlighted text, must select/adjust text rather than assign a label.
- Apply only the minimum repeat/rearm protection demonstrated necessary in 17. Specifically test a newly selected range while old momentum continues; if that labels unintentionally, the gate fails. No timers or physical-gesture boundary claims without evidence.
- Show actual configured label names/directions and the instruction from 17. Successful assignment shows/announces the label and makes Undo available. Do not show a “release to assign” state for wheel input; a scroll event is not a pointer release.
- Ineligible input, open dialogs, range replacement, restore, completion, hide/blur, scrolling/reflow that invalidates hit geometry, and destroy cannot act on stale text. Guard the current pending target, not screen coordinates stored as identity.

## Small implementation boundary

`src/pointer.js` owns document-surface pointer input: click-to-select, saved-highlight activation, the overlap chooser and the passive `wheel` listener that applies the trigger rule, with pending rectangles re-read at event time. `src/review.js` composes it and owns the shared `classify` path; `ReviewSession` remains the only committed-state/history owner. Reuse `src/text.js` anchors. The pointer-drag swipe (`src/gesture.js`, preview overlay, `touch-action: pan-y`) is removed. No gesture dependency or new host label/export schema/configuration is needed.

## Proof

Regression cases: native left/right; repeated events; no pending/saved-only/outside hit; pure vertical input; mixed axes/default behavior; zoom chords; unsupported mouse wheel; selection change; late momentum/new selection; native exact drag across formatting; Undo/Redo; both themes; reduced motion; embedding in a scrollable host. Use browser integration plus the actual devices in 20. Synthetic wheel events alone do not establish OS delivery or default scrolling.

## Implementation record (2026-10-29)

- Superseded in part by [26](26-HIERARCHICAL-AND-MULTI-RANGE-SELECTION.md): the listener is non-passive, cancels qualifying events and their 200 ms continuation, and a continuation never commits, which closes the late-momentum limitation below.
- Trigger: passive `wheel` on the document surface. Labels only with a pending range, no open dialog, no Ctrl/Meta, `deltaX !== 0 && deltaY === 0`, and the event point inside a current pending client rectangle. The native range is synchronized first; `deltaX < 0` → left label, `> 0` → right, through `classify`. No timers, thresholds or rearm state; the event is never canceled.
- Browser regressions (`tests/browser-check.js`, dispatched `WheelEvent`s, Chromium/Firefox/WebKit): pure left/right label once with the right label and exact quote; repeated and reversed events after commit do nothing and never relabel; vertical, mixed-axis, Ctrl, Meta, outside-rectangle, no-pending, saved-only (active) and dialog-open events never label; no event is `defaultPrevented`; a pointer press on pending text is not canceled, captured or previewed and a following release never labels. `tests/review.spec.js` adds a real Playwright mouse drag starting on pending text (native selection changes, no annotation) and Playwright-generated wheel input (vertical ignored, horizontal labels once). These are browser-level synthetic events; they do not establish OS delivery, trackpad momentum or default scrolling.
- Known native-evidence limitation, **not a pass claim**: a late event from an old momentum stream that lands on a *newly* made pending selection labels that new range. Portable APIs cannot tell it from a fresh gesture; the browser check *Known limitation: a late wheel event after a new selection labels that new range* pins current behavior. Native trackpad evidence (17) decides whether a guard is needed.
- Developer probe for 17: `npm start`, then open `/tests/wheel-probe.html`.

## Done

- [x] Relevant failures demonstrated before the scoped change; sequence/DOM tests pass.
- [ ] Native desktop acceptance and unchanged annotation/export invariants recorded.
- [ ] Help/usage/verification updated; rebuilt app/library; 13 remains open where proof is missing. (Status copy, README, IMPLEMENTATION and rebuilt `dist/` done; `docs/VERIFICATION.md` is plan 25 slice 5; the whisper/help surface is slice 4.)
