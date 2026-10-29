# Application implementation plans

Seed: [selection-swipe-library.md](../../selection-swipe-library.md). The seed remains the product contract; these plans divide its implementation, not its release scope.

Plans **01–12** are complete for core/local acceptance. **14** is complete with both real downloads verified in the initial nine-job CI matrix. **15** (saved-review reopening) and **16** (night theme) are implemented and locally verified; expanded CI and remaining native accessibility checks are pending. **13** remains open: the initial Windows/Linux/macOS × Chromium/Firefox/WebKit run passed, but the newer feature/shortcut tests must pass that gate too. See [verification](../VERIFICATION.md).

Latest recorded local proof: **21 Node tests**, **31 core browser checks**, and **9 host checks**. The browser pages passed in Chromium and Safari on macOS. The earlier [green CI run](https://github.com/recircuitcoop/review/actions/runs/39318606377) covers 17 Node tests and 10 browser tests per job; it does not cover the subsequent unpublished changes. Displayed shortcuts now use Cmd on macOS and Ctrl elsewhere; the new remapping/display regression passed locally.

## Newly requested interaction work

The user reports that desktop swiping is not understandable. Following a joint UX-expert/senior-frontend review, plans **17–20** are documented and **not implemented**. The preferred desktop prototype is **select → hover the highlight → native horizontal scroll → label**. The user rejected dragged-text/handle instructions and custom diagonal recognition. Preserve OS/browser scrolling, zoom and navigation; do not transfer the pointer prototype's thresholds to wheel input. Mobile selection/swiping has a separate native-device gate.

Proceed **17 → 18 → 19 → 20**, with no implementation past a failed prerequisite. Existing 07 checks prove the earlier prototype within their recorded limits, not acceptance of this new UX. Existing 13 remains open; its desktop interaction claims must include the relevant new desktop evidence. See the [user decisions and joint review](17-NATIVE-SCROLL-UX-PROTOTYPE.md).

## Working method

Widget visual planning is tracked in [21 — Library widget design](21-LIBRARY-WIDGET-DESIGN.md), with accepted flow decisions in [22](22-WHISPER-USER-FLOW-REVIEW.md). The lo-fi and [23 — High fidelity](23-WIDGET-HIGH-FIDELITY.md) are approved and implemented in production. A fixed-height toolbar swaps in through •••. The contextual whisper uses actual label values, explicit checked assignment and no idle row; the keyboard icon opens shortcut help. Done and the retained Export files control are the user-facing export actions ([25](25-ASSESSMENT-REMEDIATION.md)). These design gates precede production UI work in 18/19 and do not replace native-input proof.

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
| [17 — Native-scroll UX prototype](17-NATIVE-SCROLL-UX-PROTOTYPE.md) | Validate hover + native horizontal scrolling and first-use understanding. | Current implementation; before 18 |
| [18 — Desktop hover/scroll labeling](18-DESKTOP-HOVER-SCROLL-LABELING.md) | Map native horizontal input over pending text to one correct label. | 17; feeds 13/20 |
| [19 — Mobile selection and swipe](19-MOBILE-NATIVE-SELECTION-AND-SWIPE.md) | Preserve native text selection/scroll/zoom while enabling deliberate labeling. | 17, shared safety from 18 |
| [20 — Input UX acceptance](20-INPUT-UX-ACCEPTANCE.md) | Prove desktop discoverability and actual desktop/mobile hardware behavior. | 18, 19; desktop evidence feeds 13 |
| [21 — Library widget design](21-LIBRARY-WIDGET-DESIGN.md) | Choose one of five lo-fi directions, then agree high-fidelity design and detailed interactions. | 17 decisions; before production UI in 18/19 |
| [22 — Whisper user-flow review](22-WHISPER-USER-FLOW-REVIEW.md) | Agree state-led guidance, correction flow and narrow/multiline priorities after UX/design/frontend review. | 21 selected direction; native instruction depends on 17 |
| [23 — Widget high fidelity](23-WIDGET-HIGH-FIDELITY.md) | Refine the approved composition, palettes, typography and control states for user review. | 21/22 accepted lo-fi; before production UI |
| [24 — Instance style configuration](24-INSTANCE-STYLE-CONFIGURATION.md) | Configure background, colours, buttons, typography, spacing and borders at mount; retain approved defaults. | 23 approved visual style |
| [25 — Assessment remediation](25-ASSESSMENT-REMEDIATION.md) | Keep Export, implement 18 and 23, refactor the controller, fix defects, refresh records, land with green CI. | 18, 23 |

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

No backend, accounts, collaboration, model suggestions, extra labels, or mutable-document reattachment is introduced. Touch is currently unverified; the newly requested mobile work is scoped in 19–20. The demo remains a small host for the library; no setup/file forms are added to the mounted library.
