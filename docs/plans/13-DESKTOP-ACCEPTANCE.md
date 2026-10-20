# 13 — Desktop acceptance

Status: initial nine-job cross-platform CI passed; final expanded acceptance and native manual checks remain open; see [verification](../VERIFICATION.md). Depends on: 01–12, 14–16. Covers seed acceptance: 1–14, guided saved-review opening, and both themes.
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

The initial nine-job workflow passed on commit `e828842` in [run 3](https://github.com/recircuitcoop/review/actions/runs/39318606377): Windows/Linux/macOS × Chromium/Firefox/WebKit. The first run exposed a file-opening shadowed-variable bug, fixed in `634796e`; `e828842` refreshed the offline bundle. This session still cannot bind the local test server or write Git metadata, but authenticated GitHub browser access enabled those remote commits.

The latest local changes add 31 core checks, 9 host checks, theme preference/contrast tests, and actual saved-review download round trips. Playwright discovers 48 cases across three engines (16 per engine); these additions have not yet been published/run in the OS matrix. Native OS-reserved shortcut delivery and targeted screen-reader announcements also remain unverified. Do not treat the earlier green matrix as proof of these later changes.

## Newly reopened desktop UX gate

User feedback on 2026-10-20 reopens desktop swipe discoverability. The requested replacement prototype uses native horizontal scrolling while hovering a pending selection (17–18), with no dragged-text control or custom diagonal recognizer. Before desktop interaction sign-off, include the desktop evidence in 20. Earlier pointer/CI passes are retained as historical regression evidence, not proof of this new interaction. Mobile has a separate physical-device gate in 19–20. These are planned follow-ups; no new gesture implementation is claimed.
