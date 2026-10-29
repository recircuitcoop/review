# 07 — Swipe classification

Status: **retired** (2026-10-29, [25](25-ASSESSMENT-REMEDIATION.md) slice 3). The pointer-drag swipe, its thresholds and preview were removed; desktop labeling is native horizontal scrolling under [18](18-DESKTOP-HOVER-SCROLL-LABELING.md) and touch labeling is [19](19-MOBILE-NATIVE-SELECTION-AND-SWIPE.md) work. The record below is historical. Original pointer prototype was locally verified; desktop UX reopened by user feedback and mobile unverified. See [historical evidence](../CORE-COMPLETION.md) and new [plans 17–20](17-NATIVE-SCROLL-UX-PROTOTYPE.md). Native release coverage remains open in 13/20. Depends on: 05. Covers seed acceptance: 3, 4.
Seed: [selection and gesture contract](../../selection-swipe-library.md#selection-and-gesture-contract).

## Outcome

A separate horizontal swipe on the active highlight invokes the shared classification command once.

## API contract

Only a gesture beginning on an existing pending highlight can preview/commit a swipe. Preview moves a temporary representation of the entire selection and displays the destination label without shifting document layout. Use pointer events; pointer cancellation and Escape cannot commit.

Incomplete/canceled swipes retain pending state. Vertical motion keeps scrolling usable. The prototype commits at horizontal release displacement ≥60 CSS pixels and ≥1.5 times the absolute vertical displacement. Preview becomes visible at 8 horizontal pixels; final displacement owns classification, so reversal below threshold cancels. Respect reduced motion. Touch selection remains outside this slice.

## Tests and evidence

- Browser swipes in both directions commit the configured label exactly once, including multiline selections and repeated pointer-up delivery.
- Below-threshold motion, reversal that fails the final threshold, pointer cancellation, and Escape create no annotations and retain the range.
- Vertical/diagonal movement outside the direction threshold permits scrolling without classification.
- A range-creation drag or a swipe starting outside the active highlight never labels; preview leaves text anchors/layout unchanged.

## Done

- [x] Boundary tests immediately below/at/above documented thresholds pass.
- [x] Trusted pointer checks confirm preview, scrolling, and reduced motion; injected cancellation during trusted movement confirms cleanup and retained pending text. See the evidence for the OS-interruption limit.

## UX review follow-up (2026-10-20)

Prior checked items apply to the original pointer prototype only. The user cannot discover the mouse/trackpad action and rejects desktop dragged-text controls. The preferred new desktop prototype uses native horizontal scrolling over pending text, without custom diagonal recognition or native-scroll suppression. No code changes have been made for that proposal. Mobile selection/handles/scrolling/pinch and native touch classification remain to be designed and verified separately. Complete gates 17–20 before making broader swipe UX/support claims.
