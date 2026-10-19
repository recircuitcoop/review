# 13 — Desktop acceptance

Status: partially verified; see [verification](../VERIFICATION.md). Depends on: 01–12, 14–16. Covers seed acceptance: 1–14, guided saved-review opening, and both themes.
Seed: [acceptance conditions](../../selection-swipe-library.md#acceptance-conditions) and [first checkpoint](../../selection-swipe-library.md#first-implementation-checkpoint).

## Outcome

Prove the complete desktop library workflow in a small host fixture; do not add features here.

## API contract

The integrated public API, JSON schema, effective shortcuts, event semantics, supported Markdown, and declared desktop platforms must match the seed and completed plans. All 14 acceptance conditions and every shortcut row are release requirements, including overlap editing and precise selection.

Record exact tested browser/OS versions. Automated browser engines and synthetic modifier events do not prove native OS shortcut delivery. Keep unverified combinations explicitly unsupported/unverified rather than claiming full coverage.

## Tests and evidence

- Run one pointer workflow: formatted range → swipe → overlapping annotation → edit/history → grouped/split export → fresh-instance restore → Done.
- Run one keyboard-only workflow: block selection → F2 cross-block precise selection → labels → saved navigation/chooser → undo/redo → help/remap → export → Done.
- Exercise reflow/font loading, cancellation/scrolling, malicious Markdown, incompatible restore, and failed-save retry using existing regression fixtures.
- Check every shortcut row on declared platforms, visible control equivalents, accessible names/announcements, focus restoration, reduced motion, and read-only text. Include a targeted assistive-technology pass.

## Done

- [ ] All 14 seed conditions and shortcut rows map to passing tests or recorded platform evidence; required behavior is not waived.
- [ ] Actual validation commands/results, supported combinations, and material limitations are documented.
- [ ] No new product scope was introduced; touch and expanded browser coverage remain separate work.

Include plan 15's fresh-app reopen → edit → export → reopen flow and verify both label files from plan 14 before release sign-off.
Repeat the workflow in light/night themes and verify contrast, preference behavior, and unchanged annotation state from plan 16.

## Execution and external blockers

The final gate depends on 14–16, so those implementations must land before complete release validation. Finish available core checks first, implement those slices, then repeat the integrated acceptance workflows. Do not mark this gate complete solely because CI configuration exists.

The current sandbox cannot bind the Playwright server (`listen EPERM`), access GitHub, or initialize `.git`. The nine-job workflow is ready but has no observed successful run. Native Windows/Linux, current Firefox and targeted screen-reader/OS-shortcut results remain required. Local offline browser acceptance pages supply additional evidence without substituting for those platforms.
