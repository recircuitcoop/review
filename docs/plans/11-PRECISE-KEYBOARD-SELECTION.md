# 11 — Precise keyboard selection

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 04, 10. Covers seed acceptance: 10, 11, 14.
Seed: [keyboard selection contract](../../selection-swipe-library.md#capabilities-and-keyboard-shortcuts--initial-release).

## Outcome

Select exact text by keyboard, including across blocks, while the document remains read-only.

## API contract

F2 enters scoped caret navigation at the focused block's start; it does not require browser-wide caret browsing. Ordinary arrows move the caret, Shift+arrows extend the range, and platform-native word selection remains available. Use the canonical range and pending-selection path from 03/04.

F2 exits while retaining a nonempty range; Escape cancels it. Moving focus alone preserves the range. Typing, paste, cut, Delete, and Backspace cannot mutate document text. Classification shortcuts route through the shared command; ordinary arrows never classify.

## Tests and evidence

- Real browser keyboard input selects an exact partial phrase, extends across formatting and paragraphs, exits with F2, and labels via the normal command.
- Ctrl+Shift+arrows on Windows/Linux and Option+Shift+arrows on macOS retain word-selection behavior.
- Escape, empty ranges, toolbar focus, and repeated entry/exit preserve the documented state and usable focus.
- Typing/paste/cut/deletion attempts leave rendered and canonical text unchanged; arrow movement produces zero annotations.

## Done

- [x] Keyboard-only browser checks prove precise cross-block selection without editable document content.
- [x] Any platform limitation is recorded for the desktop acceptance gate; no mock-only pass.
