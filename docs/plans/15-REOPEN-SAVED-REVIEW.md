# 15 — Reopen a saved review

Status: implemented and locally verified; expanded cross-platform and updated-download acceptance is pending. Depends on: 09, 14. Reuses existing validated restore and editing commands.
Seed: [reopen a saved review](../../selection-swipe-library.md#reopen-a-saved-review). Contract: [saved-review opening](../IMPLEMENTATION.md#reopen-a-saved-review).

## Outcome

Open an existing review, update its annotations, and export the complete updated label files.

## API contract

Provide an “Open saved review” flow accepting the unchanged original Markdown plus one grouped annotation JSON or both split label JSON files. Read document identity/version and label IDs/names/directions from saved metadata; users do not retype labels. Match files by metadata, not filenames or selection order.

Reuse `mountReview` and `restore`; validate all input in a candidate session before replacing the current review. Missing split partners, conflicting metadata, changed Markdown, malformed JSON, or invalid anchors produce useful errors without losing current annotations or pending work. Protect unsaved work before a successful replacement.

Restored annotations retain IDs, labels, quotes, positions, and overlaps and become the baseline of a fresh undo history. Existing controls add, relabel, or delete annotations; undo/redo affects edits made after reopening. Export includes unchanged and edited annotations, using both `<file>_<label>.json` filenames from plan 14.

## Tests and evidence

- Fresh app → open Markdown and grouped JSON → verify saved labels/highlights → edit/add/delete → export → reopen and compare the full result.
- Repeat with both split files in either selection order, arbitrary filenames, custom labels, and an empty label group.
- Preserve stable IDs, overlapping/repeated passages, emoji, list/code ranges, and the new-session undo baseline.
- Missing partner, mixed sessions, changed source/version, corrupt JSON, or wrong quote fails atomically; a canceled replacement retains the current review.
- Capture both actual updated label downloads and verify that unchanged annotations remain present; exercise the cross-platform browser matrix.

## Done

- [x] Focused host-flow tests fail before implementation and pass using the existing restore model.
- [ ] Reopen → edit → export → reopen works with grouped and split input; rebuilt offline app and usage docs match.
- [x] Verification records actual results and outstanding platform gaps.

Implementation detail: a separate “Open saved review” form is available before any review starts. Candidate parsing, SHA-256 source matching, mount and restore run before the replacement confirmation. Confirmation cancellation destroys only the detached candidate. Loading controls preserve the current pending range; both load buttons are disabled during reads to prevent out-of-order replacement. Labels are populated from saved metadata after a successful swap.

Local evidence: the 9-check host page passes in Chromium and Safari on macOS, including grouped/split reopening, saved labels/IDs, a fresh undo baseline, edits/reopen, pending preservation, canceled replacement and invalid-input rollback. `tests/host.spec.js` adds actual updated-download round trips for grouped and split input; those new CI cases remain unrun.
