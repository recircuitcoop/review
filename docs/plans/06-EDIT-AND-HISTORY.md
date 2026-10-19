# 06 — Edit and history

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 05. Covers seed acceptance: 5, 12, 13.
Seed: [proposed defaults](../../selection-swipe-library.md#proposed-defaults-requiring-ux-validation) and keyboard capability table.

## Outcome

Activate, relabel, or delete one saved annotation; undo/redo each committed change.

## API contract

Editing preserves annotation identity and anchors. A saved target is separate from a pending range; a new pending range takes classification precedence. Overlaps retain independent labels/ranges. Validate saved-highlight click precedence and overlap chooser behavior against the proposed defaults.

Creation, relabeling, and saved deletion enter one undo history. Pending cancellation does not. Undo/redo cancels pending state first. Escape deselects saved targets; Delete/Backspace acts only on an explicit target. Provide visible controls. Emit update/deletion events and keep focus usable.

## Tests and evidence

- State tests run create → relabel → delete → undo all → redo all, preserving IDs and labels; a new committed edit after undo invalidates the redo branch.
- Browser tests edit identical and partially overlapping ranges independently; no chooser action implicitly edits multiple annotations.
- Chooser arrows/Enter activate one target; Escape dismisses it before clearing underlying state.
- Pending deletion changes no history; no-target deletion changes no document text; highlights match state after every history action.

## Done

- [x] State and browser edit/history checks pass; no second history exists.
- [x] Overlap defaults and event semantics are documented with evidence.
