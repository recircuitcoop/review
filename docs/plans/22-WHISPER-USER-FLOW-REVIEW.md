# 22 — Whisper user-flow review

Status: **specialist review; proposed flow, not implementation or user-tested copy**.

Latest completion decision: **no standalone Export control** in the mounted interface or shortcut popup. Done resolves any pending range, then automatically runs the configured export/completion flow. Keep retryable failure handling and both label outputs. The host's programmatic export API remains available; this is a user-interface decision. The current lo-fi removes Export and calls the completion shortcut `Done & export`; it does not download files.

Latest visibility correction: **no whisper in the idle reading state**. Hide the entire row, including both label names, whenever there is no passage being selected/reviewed. Clearing a selection or Undo removes the row; there is no `Select text to label` or `Annotation undone` whisper attached to unselected text. Pending text, an explicitly active saved annotation and the already-approved just-labeled passage confirmation retain their contextual row. The keyboard-help button remains available in the top bar. This supersedes idle/after-Undo centre-copy suggestions below.

Latest confirmation refinement: show the **actual assigned label with a checkmark**, not generic `Labeled`. Example: `✓ Accept · Cmd+Z undo`; editing an active annotation shows `✓ Accept · ••• to edit`. The matching endpoint also retains its checkmark and underline, with stronger type. Both texts derive from the same configured label identity. The all-states preview includes a dedicated assigned-label example so this result can be assessed directly.

Confirmed navbar correction: **swap, never expand**. The navbar retains the same 62px height. ••• replaces the filename area with action commands in that same row; the keyboard icon, ••• and Done stay in their existing positions. Pressing ••• again restores the filename. No added row, shelf or document displacement. At narrow widths the action strip uses native horizontal overflow within the existing row; it never wraps into another row. The keyboard icon replaces the duplicate Help text button. This supersedes the earlier wrapped-toolbar proposals and `Toolbar expanded` terminology (the internal historical scene key is retained only for preview state compatibility).

User decision after visual review: **Undo after labeling is preferred**. Retain the effective Undo shortcut in immediate assignment feedback. The continuation copy is no longer the preferred alternative. Additional lo-fi state review is in `docs/design/widget-whisper-states.html`: pending, reading, precise selection, saved editing, after-Undo, expanded toolbar and the narrow multiline/long-label tradeoff. The remaining state copy and responsive exception are still proposals.

For direct inspection without carousel navigation, `docs/design/widget-whisper-all-states.html` displays those seven states together, each with a visible heading.

Latest user refinement: remove `F2 to finish` from the whisper; keep platform-specific Undo advice when there is committed history to reverse. Add an always-visible **keyboard icon** in the top bar, next to •••, opening a keyboard-shortcut popup with visual keycaps. This explicitly supersedes the earlier rejection of additional help icons for this requested keyboard control. The popup shows actual label names and platform key symbols, with selection/navigation commands in an expandable section. Help and F1 open the same popup. Close/Escape returns focus without clearing the target; the popup takes keyboard priority while open. No change to the existing meaning of F2 or Undo is implied by changing the whisper copy. The precise-selection example now includes an earlier annotation so the displayed Undo hint is truthful; with no history, it says `Selecting text`.

Preview correction: in the all-states page, the modal was centred within the entire tall preview iframe and opened offscreen. Anchor its top to the invoking keyboard button, so the popup appears in the state being reviewed. Verify actual visibility, close/Escape and retained selection in the existing Safari preview.

Safari preview proof: the popup was visibly inspected on screen with label commands and keycaps. Escape closed it; opening/closing from the pending-selection example retained the `Unlabeled` state. Closing explicitly returns focus to the keyboard button. These checks cover the lo-fi preview, not the production library.
Depends on 17's native-input gate and the selected visual direction in 21. This refines 21; it does not reopen the approved styling or pass 13/17–20.

## Review scope and agreed direction

The user explicitly requested independent UX-expert, product-designer and senior-frontend reviews. Their source/design reviews agree that another five slogans will not resolve the flow. Keep Toolbar swap, solid underline, passive actual label names at opposite ends and one centre line. No new tooltip layer, help icon, rotating instructions or required confirmation click.

The centre answers two questions: **what state is this passage in, and what is the next useful action?** Guidance changes with meaningful application state, not elapsed time or incidental pointer movement. Classification, cancellation, correction and finding secondary controls are different tasks, not interchangeable default hints.

## Findings that change the proposal

- `Scroll ←/→` omits the target: users may scroll over the whisper rather than selected text. Conversely, `scroll over selection` may imply vertical scrolling. Test whether an explicit horizontal arrow plus the target is understood; do not assume it.
- `Esc cancels` and `••• for actions` foreground secondary tasks when the immediate task is assigning a label. Escape also closes an expanded toolbar before clearing text, so blanket cancellation advice is wrong.
- Pending text, just-assigned feedback and an explicitly active saved annotation are different states. The sketches currently blur these states. Native horizontal labeling is planned for pending text only; it must not silently relabel saved text.
- Undo reverses committed history and clears selection. The sketches incorrectly return to pending text. Do not base production flow on that preview shortcut.
- `Labeled` never means `saved`. Export or host save success needs its own confirmed outcome.
- Complete arbitrary labels, explanatory copy and one row cannot always fit at narrow widths. Resolve priorities instead of silently truncating distinct labels to the same prefix.

## Proposed sequence to review with the user

Copy is illustrative. Production shortcuts must come from effective bindings and reflect interaction mode.

| Situation | Centre message / priority | Effect on flow |
| --- | --- | --- |
| Reading, no target | `Select text to label` | Gives a starting action; does not call existing annotations unlabeled. |
| Precise keyboard selection | `Selecting text · F2 to finish` | Do not teach a labeling shortcut while arrows are owned by precise-selection navigation. |
| New pending passage, pointer workflow | `Unlabeled · scroll over selection ↔` | Names pending state, required target and intended horizontal movement. Longer explicit wording is a test alternative, not another permanent line. |
| New pending passage, keyboard workflow | `Unlabeled · {effective labeling shortcut}` | Applicable only after precise-selection mode ends; do not switch based on incidental pointer motion. |
| Just assigned | `Labeled · {effective Undo shortcut} undo` | Confirm the annotation and offer recovery. Check/underline the actual endpoint label; do not create an implicit editing target. |
| Existing single annotation explicitly activated | `Labeled` or `Editing annotation` | Show the actual assigned endpoint. Editing/relabeling commands are available via toolbar/keyboard; no scroll-to-relabel promise. Final copy still to choose. |
| Overlap needs a target | `Choose an annotation` | Resolve identity before relabel/delete. Keep the existing accessible chooser. |
| Toolbar open | Preserve target/state; suppress misleading gesture advice when attention is in controls | Opening/collapsing must not clear, label or modify the range. First Escape closes the bar. |
| Selection canceled | `Select text to label` | Cancellation is normal; no warning or error treatment. |
| Undo | Brief factual feedback such as `Annotation undone`, then current state | Never imply a pending range or active annotation that does not exist. |

The end labels always derive from accepted host configuration. State and assigned identity must remain understandable without color. A confirmation can remain until the next deliberate state transition; do not invent a fade timeout now. Keep the guidance stable while a pending range remains. Feedback attached to a prior passage must not remain as if that passage is still the active task after the user moves elsewhere.

The specialist tradeoff was resolved by the user in favor of the Undo shortcut immediately after assignment. Frontend's continuation alternative remains historical. The shortcut reflects actual global history, not a new command targeted specifically at that passage; successful classification still clears the target.

## Ownership and native-input gates

Derive presentation from the existing session's pending range, active annotation, overlap chooser, precise-selection mode, toolbar state and available history. A last-action message is presentation feedback, not a second committed-state store. Do not add selection restoration to Undo to match the sketch.

The passive native-scroll prototype in 17 must establish mapping, momentum/duplicate behavior, OS navigation and nested horizontally scrollable code conflicts before the instruction promises working behavior. No axis-ratio classifier, vertical-to-horizontal conversion or cancellation of native scrolling is introduced to make the copy true. Narrow width and coarse pointer do not prove touch support. Mobile guidance waits for the actual mobile interaction decision.

Accepted label-name changes must refresh whisper and controls from stable label IDs. The host update API/validation decision in 21 remains open; the sketch's preset changes are not an implemented library API.

## Two decisions before high fidelity

1. **Narrow width:** proposed priority is label identity and state first, explanatory advice second. Shorten the centre to `Unlabeled` if needed. If the two real label names still cannot fit, agree an explicit exception to one-row presentation rather than losing their distinction. No extra tooltip is assumed.
2. **Multiline placement:** review a whisper below the final selected line, with stable placement and no movement during the gesture. Determine how to avoid document jumps and obscured native handles using an actual formatted, cross-block example.

## Small next proof

Visual review source: `docs/design/widget-whisper-flow.html`. It shows two complete interactive storyboard variants (continuation versus Undo emphasis) and a narrow multiline/long-label stress case. The first two start just after a label, making the open copy choice visible immediately. Click another passage to select, use •••/keyboard to label, click committed text to edit, and use Undo to reverse history without restoring pending text. Preview controls also expose reading, pending, precise, just-assigned, editing, after-Undo and toolbar states. Native scrolling is not implemented by the storyboard.

The narrow stress case deliberately allows endpoint names to wrap while shortening centre advice to `Unlabeled`; it exposes the proposed exception to the single-line requirement for discussion, not as an approved responsive rule. No new tooltip or help icon is introduced. Prototype assertions cover commit/Undo/Redo target clearing; this is preview proof, not production acceptance.

- [ ] Review one coherent storyboard: read → select → label → confirm → undo → continue, including an existing saved annotation.
- [x] Show a multiline range and two long labels in a narrow container for discussion.
- [x] Correct the new storyboard's commit/Undo/Redo target transitions and distinguish saved editing.
- [ ] First-use task with no coaching: select a sentence, assign both labels, correct a mistake and continue. Observe where scrolling is attempted, whether horizontal input is understood, and whether passive names look clickable.
- [ ] Verify keyboard mode, focus preservation, remapped hints, Escape priority and restrained screen-reader announcements.
- [ ] Record native-input evidence separately; only then finalize truthful device-specific guidance and proceed to implementation/high fidelity gates.

No new hardware tests, user research or production application changes were performed by this review.
