# Application implementation plans

Seed: [selection-swipe-library.md](../../selection-swipe-library.md). The seed remains the product contract; these plans divide its implementation, not its release scope.

Plans 01–12 are complete for core implementation and local acceptance. See the [completion audit](../CORE-COMPLETION.md): 12 Node tests and 30 browser checks pass, with trusted pointer/keyboard evidence. **Plan 14 is the next fix** for split-download delivery and label-based filenames. Plans 15 (guided saved-review opening) and 16 (night theme) are documented and pending. Plan 13 is partially verified and must cover all follow-ups plus native cross-platform testing. See [verification](../VERIFICATION.md) for actual evidence and limits.

## Working method

Write any missing contract details in the owning plan before tests or code. Add the listed failing tests, implement only that slice, then check off its completion items with actual commands and evidence. Reuse the same fixtures and test harness. Do not invent commands before tooling exists.

Keep accessibility in every interaction slice. Use real browser tests for selection, pointer, focus, and keyboard behavior; pure state and serialization checks belong in unit tests. Emulated DOM tests alone cannot prove native selection or caret navigation.

## Sequence

| Plan | One outcome | Depends on |
| --- | --- | --- |
| [01 — Engine feasibility](01-ENGINE-FEASIBILITY.md) | Executable checks establish the engine and test harness. | — |
| [02 — Safe document rendering](02-SAFE-DOCUMENT-RENDERING.md) | Valid input becomes sanitized, selectable HTML. | 01 |
| [03 — Canonical text anchors](03-CANONICAL-TEXT-ANCHORS.md) | DOM ranges round-trip through versioned UTF-16 positions. | 02 |
| [04 — Pending selection](04-PENDING-SELECTION.md) | Clicks and drags create a pending range without labeling. | 03 |
| [05 — Commit and highlight](05-COMMIT-AND-HIGHLIGHT.md) | Label buttons commit once through a shared command. | 04 |
| [06 — Edit and history](06-EDIT-AND-HISTORY.md) | Saved annotations support independent editing and undo/redo. | 05 |
| [07 — Swipe classification](07-SWIPE-CLASSIFICATION.md) | A separate horizontal gesture classifies the pending range. | 05 |
| [08 — JSON export](08-JSON-EXPORT.md) | Committed state becomes grouped or split JSON. | 06 |
| [09 — Validated restore](09-VALIDATED-RESTORE.md) | Compatible exports restore without changing identity. | 08 |
| [10 — Keyboard commands](10-KEYBOARD-COMMANDS.md) | Scoped commands, remapping, toolbar, and help work together. | 06, 07, 08 |
| [11 — Precise keyboard selection](11-PRECISE-KEYBOARD-SELECTION.md) | Read-only caret navigation creates exact cross-block ranges. | 04, 10 |
| [12 — Completion and lifecycle](12-COMPLETION-AND-LIFECYCLE.md) | Hosts can finish, retry saves, and destroy safely. | 09, 10, 11 |
| [13 — Desktop acceptance](13-DESKTOP-ACCEPTANCE.md) | The complete workflow passes on declared platforms. | 01–12, 14–16 |
| [14 — Split export delivery](14-SPLIT-EXPORT-DELIVERY.md) | Both label files download with `<file>_<label>.json` names. | 08, 12; before 13 |
| [15 — Reopen saved review](15-REOPEN-SAVED-REVIEW.md) | Load saved annotations, edit, and export the complete revised review. | 09, 14; before 13 |
| [16 — Night theme](16-NIGHT-THEME.md) | Light/night switching preserves readability and annotation state. | 02, 05; before 13 |

## Acceptance coverage

Numbers refer to the seed's “Acceptance conditions.” Plan 13 verifies all conditions together.

| Seed condition | Owning plans |
| --- | --- |
| 1 — Block click versus exact drag | 04 |
| 2 — Formatted and cross-paragraph quotes/positions | 03, 08 |
| 3 — Pending versus committed; one commit per swipe | 04, 05, 07 |
| 4 — Canceled gestures and scrolling | 07 |
| 5 — Edit/history/highlight/export consistency | 06, 08 |
| 6 — Resolve pending selection on Done | 12 |
| 7 — Export/restore identity | 08, 09 |
| 8 — Repeated text, emoji, non-Latin text | 03, 09 |
| 9 — Reflow and incompatible restore | 03, 09 |
| 10 — Full workflow through buttons and keyboard | 05, 10, 11, 12 |
| 11 — Complete contextual shortcut map | 10, 11, 12 |
| 12 — Escape and target-specific undoable deletion | 04, 06, 10 |
| 13 — Independent overlaps and accessible chooser | 06, 08, 09, 10 |
| 14 — Remapped hints, usable focus, read-only text | 10, 11, 12 |

## Decisions to resolve during implementation

- 01: evaluate current Recogito Text Annotator; choose one committed-state/history authority. It is not an adopted dependency yet.
- 03: document exact whitespace, block separators, and context extraction before freezing canonical format v1.
- 04/06: validate the seed's proposed replacement, link-click, saved-highlight, and overlap interaction defaults; record outcomes in the seed.
- 07: measure and document swipe thresholds; they are tuning values, not new host configuration requirements.
- 13: declare tested desktop browser/OS versions and mapping conflicts. Automated engine coverage does not prove OS shortcut compatibility.

No backend, accounts, collaboration, model suggestions, touch validation, extra labels, or mutable-document reattachment is included. The demo is a small host for the library, not a separate application platform.
