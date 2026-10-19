# 07 — Swipe classification

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 05. Covers seed acceptance: 3, 4.
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
