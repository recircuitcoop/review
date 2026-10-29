# 18 — Desktop hover and horizontal scroll

Status: implementation under [25](25-ASSESSMENT-REMEDIATION.md) (user-directed, ahead of 17's study), with the trigger rule recorded there; native desktop acceptance open. Depends on: 17. Reopens desktop gesture UX from 07; verification feeds 13 and 20.

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

Existing `src/review.js` owns scoped input/hit testing and feedback; `ReviewSession` remains the only committed-state/history owner. Reuse `src/text.js` anchors. Keep `src/gesture.js` pointer behavior separate from native wheel behavior. No gesture dependency or new host label/export schema/configuration is needed.

## Proof

Regression cases: native left/right; repeated events; no pending/saved-only/outside hit; pure vertical input; mixed axes/default behavior; zoom chords; unsupported mouse wheel; selection change; late momentum/new selection; native exact drag across formatting; Undo/Redo; both themes; reduced motion; embedding in a scrollable host. Use browser integration plus the actual devices in 20. Synthetic wheel events alone do not establish OS delivery or default scrolling.

## Done

- [ ] Relevant failures demonstrated before the scoped change; sequence/DOM tests pass.
- [ ] Native desktop acceptance and unchanged annotation/export invariants recorded.
- [ ] Help/usage/verification updated; rebuilt app/library; 13 remains open where proof is missing.
