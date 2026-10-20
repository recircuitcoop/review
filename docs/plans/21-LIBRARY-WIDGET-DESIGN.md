# Library widget design

Status: **Toolbar swap and Inline whisper lo-fi approved. High-fidelity preview ready for user review in [23](23-WIDGET-HIGH-FIDELITY.md).**

The subsequent [joint user-flow review in 22](22-WHISPER-USER-FLOW-REVIEW.md) supersedes the interchangeable centre-copy and mock transition assumptions below. UX, design and frontend review now focus on state-led guidance, accurate Undo/saved-target behavior and narrow/multiline flow before another preview. Historical sketches remain illustrative rather than behavior contracts.

Latest accepted refinement: add a keyboard icon that opens the shortcut popup with visual keycaps. Remove F2 advice from the whisper; show Cmd/Ctrl+Z Undo guidance where applicable. See 22 for the current preview contract; earlier no-extra-icon guidance does not prohibit this explicitly requested control.

## Current correction: guidance directly in the whisper

The user rejected the tooltip exploration below. Use the **centre of the existing whisper row** for short, visible guidance; no new tooltips, help icons, panels or extra line. Keep configured label names at opposite ends and the approved Toolbar swap styling. New comparison: `docs/design/widget-whisper-guidance.html`.

Five wording options: `Unlabeled · scroll ←/→`, `Unlabeled · Option/Alt+←/→`, `Unlabeled · Esc cancels`, `Unlabeled · ••• for actions`, and `Selected · scroll to label`. These are alternative messages, not an automatic rotation. Choose the default together. All show `Labeled · Cmd/Ctrl+Z undo` after assignment and `Select text to begin` when there is no selection. Effective configured shortcut mappings must own production wording; these sketches illustrate current defaults.

This supersedes the earlier instruction to keep all gesture/keyboard guidance solely in Help. No production application changes are made.

## Rejected tooltip exploration

The user approved the latest composition and requested five suggestions with a little more explanation. Preserve the solid underline, one-line whisper, configured names at opposite ends and Toolbar swap. New visual source: `docs/design/widget-whisper-tooltips.html`; it explores tooltip coverage, not a new layout.

| Suggestion | Help appears on | Emphasis |
| --- | --- | --- |
| Local hints | Selected passage, each label, centre state and toolbar controls | Short explanation of each element's purpose. |
| Gesture first | Selected passage and directional label names | Keep pointer over pending text; horizontal scroll assigns the indicated actual name. |
| Keyboard first | Label names, centre state and expanded commands | Effective platform shortcut, Escape and Undo. |
| State aware | Centre state, with content updated for no selection / pending / assigned | What has happened, what remains possible and how to reverse it. |
| Help on demand | Small ? button beside •••; opens explanation inside the top bar | Few unsolicited tips; one explicit place to ask for help. |

No suggestion is selected yet. Tooltip text derives from the same label configuration as the whisper. Passive labels must not imply click-to-classify. Hover/focus/touch help must not commit, move the selection or intercept native horizontal scrolling. Essential commands remain discoverable through ••• and Help, so access does not rely on hover. The lo-fi uses the preview runtime's standard tooltip behavior; production tooltip timing, focus/touch accessibility and actual gesture behavior still require implementation proof. Keep tooltip text concise and dismissible; do not obscure selection handles.

Comparison task: hover the selected passage, either whisper label, centre state and •••; open the toolbar to inspect command hints. In Help on demand, click ?. Preview controls can change selection state, label values and narrow layout. The five examples keep the approved styles and command semantics.
Depends on the user decisions in 17. Design selection and high-fidelity review precede production UI work in 18/19. Native-input feasibility remains an independent gate; a mockup does not pass it.

## Confirmed direction

Latest user direction: use Inline whisper. It must explicitly show a pending selection even before a label is assigned, display actual configured label values, and refresh those values when accepted host configuration changes. Explore keeping the secondary commands inside the top navigation bar, expanded/collapsed by the same ••• button.

## Current refinement: inline whisper and top bar

Latest confirmed refinement supersedes the three-way top-bar comparison below: **Toolbar swap** is selected. Use a continuous solid underline for pending text, not a dashed underline. Put the entire whisper on **one row**, with the actual first label at the left edge, selection status in the centre, and actual second label at the right edge. Example pending row: `← Accept     Selected · Unlabeled     Reject →`. After labeling, the centre reads `Labeled`, and a checkmark plus underline identifies the assigned label by its real name on the corresponding side. No second-line gesture or keyboard instructions; these remain in Help. No-selection state reads `No selection` between the configured names.

The chosen preview now shows only Toolbar swap and starts collapsed. Click ••• to replace the filename with commands; click again to restore it. Labels continue to derive from current configuration. The one-row layout preserves the centre status on narrow screens; unusually long names ellipsize within their side, with the complete value available through the existing hover/focus/touch tooltip and accessible text. The full names also remain available in the expanded command bar. This refines the earlier blanket wrapping requirement specifically for the one-line whisper; command names can still wrap.

Visual source: `docs/design/widget-inline-whisper.html`. The earlier five-way carousel below is historical exploration.

The whisper stays attached to the relevant passage and includes:

| State | Status | Direction labels |
| --- | --- | --- |
| No selection | `No selection` | Current configured values remain visible in the illustrative empty state. |
| Pending | `Selected · Not labeled yet` | `← {first label name}` and `{second label name} →`; neither appears assigned. |
| Committed / active saved | `Labeled · {actual assigned name}` | Both real names remain visible; the assigned value also has an underline. |

The whisper is passive status, not a required button group. Keep its layout space stable across these states; preserve native selection and focus. Direction arrows communicate mapping, never substitute for names. Names wrap instead of being clipped. Keyboard hints use effective host/platform mappings in the eventual implementation.

All label text derives from one accepted host configuration keyed by stable label identity. A valid display-name update refreshes pending hints, active committed status, command buttons and accessible text together, without assigning a label or adding a history entry. Do not store copied label names in whisper state. The new sketches default to the application's current configured defaults, Accept / Reject (`index.html`), with Research and Relevance pairs available through preview controls outside the depicted product. These examples do not fix the host's label vocabulary.

Compatibility boundary: the current library requires explicit reset/validated reload for document/label configuration changes. These sketches do not add a runtime API. Before implementing live display-name updates, specify and test the supported host update path; retain annotation IDs, label IDs, anchors and history. Changing label identity or ordering must never silently reclassify existing work. This is a required implementation decision, not a passed gate.

Compare three top-bar proposals; all start expanded so the differences are visible:

| Proposal | What ••• expands | What stays stable | Tradeoff |
| --- | --- | --- | --- |
| Extra row | A wrapping command row under the filename row, inside the top bar. | Filename, ••• and Done keep their positions. | Increases component height while open; simplest hierarchy. |
| Toolbar swap | Commands replace the filename inside the top bar; they wrap on narrow layouts. | ••• and Done remain reachable; collapsing restores the filename. | Most compact on a wide embed, but document identity temporarily disappears. |
| Grouped shelf | A top-bar shelf groups classification, selection/history and review commands. | Filename and main navigation remain visible. | Easiest command scanning; occupies the most vertical space while expanded. |

Click ••• again to collapse the same controls. Classification never automatically opens the bar; opening/closing does not change the selection or commit state. The sketch deliberately leaves the bar open after command use so it does not behave like a popover. Escape closes the expanded bar first; a later Escape clears pending text. Return focus to ••• if collapsing would hide the focused command. Expanded commands reflow rather than overlap the document. Help and export feedback stay inside the top bar in these proposals.

Next choice: top-bar expansion pattern, then high-fidelity/state refinement. These remain lo-fi, not production input/API implementations or mobile proof.

## Earlier direction and review

The user's feedback supersedes the original button-placement comparison: the library should be discreet and centre on **select → swipe or keyboard command → confirmation → continue reading**. No permanent pair of label buttons, Undo/Clear toolbar, side inspector, margin rails or selection sheet in the normal reading view. Selection must not open a decision panel or require an additional click before classification.

Undo remains a command; Escape clears the pending selection. Mouse-accessible label buttons and secondary commands remain reachable through one compact, keyboard-accessible actions menu. Discretion changes presentation, not capabilities or data safety. The menu must also expose annotation navigation/editing, redo, export and help in the detailed design; the lo-fi shows only the actions needed to compare selection feedback.

Design the mounted library, not the demo setup application. The host supplies document, two labels, export format and saved-review data. No file pickers or configuration forms inside the widget. Sketches use the neutral placeholders “Left label” / “Right label”; these are not fixed production labels.

Desktop hover over the pending passage + native horizontal scrolling remains the proposed gesture. No dragged text, diagonal recognizer or modifier requirement for scrolling. Keyboard labels use the existing Option/Alt+Left/Right mapping, displayed according to platform and eventual host overrides. Ordinary arrow keys retain native selection/navigation behavior. Native scrolling, zoom and text selection remain platform responsibilities.

## Review of the original five

- Context bubble: keep a small nearby hint as an option; remove the action panel and duplicate controls.
- Bottom dock: reduce to a single quiet status line; remove the permanent button dock.
- Side inspector: reject for normal classification; too much space and repeated text. Detailed editing remains a separate future state.
- Margin rails: reject large edge controls; retain an optional small margin indication only.
- Focus sheet: reject the mandatory decision surface; no need to interrupt reading to assign a label.

## Revised comparison: where should guidance and confirmation appear?

All five share the same full-width reading surface, small actions menu and Done control. Differences are feedback location, persistence and teaching—not five different command systems.

| Direction | While text is selected | After labeling | Tradeoff |
| --- | --- | --- | --- |
| Inline whisper | A short, non-interactive scroll hint just beneath the passage. | Hint becomes a small label confirmation. | Closest to the eyes; reserves a little local space and must avoid layout jumps. |
| Quiet footer | One unobtrusive component-bottom status line. | The same line confirms the label. | Stable and leaves text untouched; can be far from the passage in a tall embed. |
| Margin note | Small direction/label text in the passage's outside margin. | Margin note becomes the assigned label. | Keeps feedback attached without covering text; requires a narrow-layout alternative below the passage. |
| Underline only | Pending highlight, with directions available in Help. | Solid underline plus a short textual label beside the passage. | Most discreet; weakest first-use discoverability. Must validate whether optional first-use teaching is needed. |
| Brief receipt | A small selection hint at the lower edge. | A compact temporary receipt offers Undo, then disappears. The committed highlight remains. | Clear recovery without permanent chrome; duration, dismissal and reduced-motion behavior need accessibility review. |

Visual source: `docs/design/widget-lofi-directions.html`. The original sketches are superseded. Five grayscale sketches compare guidance and feedback, not five proposed production modes. The receipt is held visible in the Labeled preview state so it can be inspected; this does not prescribe production timing.

## Preview boundary

Clicking the sample passage simulates a pending selection. The actions menu and scoped keyboard label/undo/Escape commands demonstrate the state change. Host design controls can preview Reading, Selection and Labeled states, plus a narrow layout. These are not native text-selection, native swipe, overlap-editing, persistence or save implementations. Mobile touch behavior is not established by a narrow layout.

## Small review steps

- [x] Review the original concepts against the user's request for discretion.
- [x] Replace the button-centred comparison with five feedback treatments.
- [x] User chooses Inline whisper as the guidance/confirmation direction.
- [x] Explore explicit pending state, actual/updating label names and three collapsible top-bar variants.
- [x] User chooses Toolbar swap before high fidelity.
- [x] Refine solid selection underline and one-line whisper with actual label values at opposite ends.
- [ ] Specify reading, pending, committed, selected-saved, overlap chooser and empty states for the chosen direction.
- [ ] Specify the complete actions menu, relabel/delete/history, Escape priorities, focus return and long-label behavior.
- [ ] Specify Done with a pending range, save-in-progress, success and retryable failure. Never imply a save before host confirmation.
- [ ] Produce high-fidelity desktop/narrow and light/night designs of that direction; review together.
- [ ] Verify native selection, layout, focus, accessibility and first-use tasks before implementation acceptance.

## Acceptance for the chosen design

A first-time user can identify the selected quote, find the label directions and effective keyboard mappings, assign a label, identify the committed result and reverse an error. An ordinary mouse user can discover the actions menu and label without horizontal scrolling. Experienced users can classify without opening a menu. Reading has no permanent classification toolbar or unsolicited inspector. No focus theft or live announcements on each hover.

Pending and committed text differ by more than color. Clicking a saved highlight exposes its identity and editing; overlapping annotations remain independently reachable. Every capability remains keyboard accessible. At 320px and desktop widths, names wrap, touch targets fit, and text/native handles remain unobstructed. A reopened review distinguishes existing annotations from a new pending range. Restore stays a host/API action.

Lo-fi review chooses information hierarchy, guidance and confirmation. Typography, color, spacing and motion refinement belong to high fidelity. No production application code is changed by this plan.

Preview checks: JavaScript syntax and five-variant structure passed. Safari inspection confirmed the quiet reading layout, hidden secondary menu, menu labeling, compact committed feedback, Cmd+Z and Option+Right transitions. Native gestures, real mobile behavior and high-fidelity/accessibility acceptance remain open.
