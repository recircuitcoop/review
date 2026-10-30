# Implementation contract

The seed remains [selection-swipe-library.md](../selection-swipe-library.md). This document fixes details needed by the small plans before implementation and tests.

## Local application

The host opens a user-selected `.md`/`.markdown` file using the browser File API. The filename identifies the document; SHA-256 of the unmodified Markdown identifies its immutable version. The host offers two label names (default Accept/Reject), explicit Start review, grouped or split export, restore from previously exported JSON, and Done. Changing file/labels requires starting a new session with an explicit confirmation if a review is already open. File text is never uploaded. Split export is the default and must provide two label files, including empty labels. Download failure leaves the review and both file controls available for retry. A browser cannot confirm that a user saved a download to disk.

## Host export delivery and filenames

Required split filenames are `<file>_<leftlabel>.json` and `<file>_<rightlabel>.json`, using the configured display names. Strip only the final Markdown extension, case-insensitively. Preserve valid spaces, case, and Unicode; normalize filename components to NFC. Replace filesystem-unsafe characters (`<>:"/\\|?*` and control characters) with underscores and strip trailing periods/spaces. Reject empty components or filenames that collide after sanitization/normalization and case-insensitive comparison, with a useful message and no loss of review state. Do not silently overwrite or append direction IDs to resolve collisions. These rules affect filenames only; document identity, label definitions, and grouped/split JSON remain unchanged.

Examples: `notes.md` + `Accept` / `Reject` → `notes_Accept.json` / `notes_Reject.json`; `chapter.v2.markdown` + `Keep` / `Needs review` → `chapter.v2_Keep.json` / `chapter.v2_Needs review.json`.

Prepare both payloads and object URLs before offering split delivery. Each file needs a clearly named, independent user-activated download/retry control; completion must not depend on browsers permitting multiple automatic clicks in one handler. Keep both available until the review changes or the user leaves. Use “files ready” rather than claiming disk-save success. Export files, Done, and their shortcuts share this host path. Grouped export continues to produce one file.

Implementation status: the host now prepares both named files and offers independent download controls without automatic clicks. Both actual downloads, filenames and payloads passed the initial nine-job CI matrix; see [plan 14](plans/14-SPLIT-EXPORT-DELIVERY.md).

## Reopen a saved review

The guided host flow accepts the original Markdown and either one grouped JSON export or both split JSON exports. Existing exports contain canonical rendered text; the original Markdown supplies the formatted source. Use the saved document identity/version and both label definitions to configure a candidate annotator, then invoke the existing validated `restore` method. Require the source filename/identity and content hash to match the saved document. Validate consistent metadata across both split files, irrespective of filenames or selection order.

Do not infer an empty label from a missing split file. Present a useful request for its partner. Parsing, hashing, mount, and restore must all succeed before replacing a current review; malformed or incompatible input leaves current annotations, pending selection, history, and download controls intact. If an existing review would be replaced, protect the user's unsaved work and allow cancellation before the swap.

After reopening, preserve annotation IDs, labels, exact anchors, and overlaps. Restored annotations form a fresh history baseline; subsequent creation, relabeling, and deletion use the same commands/history as a new review. Re-export includes the entire current committed state, including unchanged annotations, in the selected grouped/split format and with plan 14's label-based filenames. File contents stay local.

Current status: the guided opening flow is implemented using the existing JSON schema and restore validation. Local grouped/split reopen/edit/rollback checks pass. New actual updated-download CI cases await publication and execution; see [plan 15](plans/15-REOPEN-SAVED-REVIEW.md).

## Night theme

Implemented locally under [plan 16](plans/16-NIGHT-THEME.md); expanded CI/native accessibility verification remains pending. A host-owned light/night toggle follows `prefers-color-scheme` until an explicit local preference exists. Store only `light` or `dark` under a `review-theme` preference key; wrap preference reads/writes so restricted storage on offline file origins cannot break review. Without persisted state, retain the chosen appearance for the current page. Observe system changes while the user has not overridden them.

Use CSS color variables for both host UI and the embedded library. Existing custom-highlight rules in `src/review.js` must consume those variables instead of their fixed colors. Include left/right, pending, active, and native selection colors plus readable code blocks, dialogs, previews, controls, and focus rings. Set the appropriate `color-scheme` so native form controls match. The embedded library inherits the host's variables without adding a public theme configuration API.

Switch appearance in place. Do not replace document nodes, remount, clear selection/history, alter canonical text, or change exported annotation data. Verify WCAG AA text/control contrast and non-color state cues. Both palettes and preference handling are implemented; local contrast/state checks pass. This does not claim a native screen-reader pass.

## Dependency and browser decision

Use Marked for Markdown and DOMPurify for sanitization; installed package documentation is the API reference while network/DNS is unavailable. Recogito cannot be fetched/evaluated in this environment and is not adopted. Native DOM Range/Selection, CSS Custom Highlight, pointer events and wheel events provide selection, overlapping highlights, clicks and horizontal-scroll labeling without an engine-owned second annotation store. The library owns all committed state and history. Initial automated target: Chromium desktop with CSS Custom Highlight and Selection.modify. Actual OS shortcut delivery and assistive technology require manual validation before broader support claims.

## Canonical text v1

Traverse sanitized document text nodes in DOM order. Preserve text-node whitespace exactly; represent `<br>` as LF. Append LF after each paragraph, heading, list item, blockquote, and preformatted block, collapsing adjacent structural separators only. Ignore whitespace-only nodes between block elements (not whitespace inside a paragraph or code). Strip trailing structural separators, not literal text whitespace. Inline markup adds no separator. The fixture `# Hi\n\nOne **two**.\n\nNext.` becomes `Hi\nOne two.\nNext.`. Code whitespace remains literal. DOM endpoints map to UTF-16 code units; end is exclusive. Generated structural separators participate in cross-block ranges. Context is up to 32 code units immediately before/after the range. UI/highlights never enter canonical text. Empty, fractional, nonfinite, reversed, and outside ranges are invalid.

## State, gestures, and editing

Core completion rules: a nonempty native drag range takes precedence over block-click selection even below the pointer-distance tolerance. Keyboard commands prevent browser defaults only when their operation is applicable. In particular, left/right classification with no pending or saved target must not consume its shortcut; Delete/Backspace inside the document remains intentionally handled even without a target.

Selectable blocks include paragraphs, headings, list items, and fenced code blocks. A list item owns clicks on its child paragraphs; the nearest nested list item or fenced code block takes precedence. Clicking code preserves indentation and line breaks. Keyboard block navigation/Enter use the same block set, without duplicate stops on child paragraphs. Exact drag selection remains exact.

One pending selection and at most one active saved annotation exist. The pending selection is an ordered set of disjoint contiguous ranges ([plan 26](plans/26-HIERARCHICAL-AND-MULTI-RANGE-SELECTION.md)): a plain click or drag replaces it, Shift+click or Shift+drag adds to it and overlapping or touching ranges merge. Labeling commits one annotation per range in a single history entry. A heading click (or Enter) selects its section up to the next heading of the same or higher rank; a list item selects its nested hierarchy. Selecting a new range deselects the saved target. Clicking a saved highlight activates it before block selection; overlaps open a keyboard-accessible chooser. Ordinary document link clicks select text without navigating. These are prototype defaults from the seed, subject to human UX validation.

All classification paths call the same state command. Pending selection takes precedence, then the active saved target; no target does nothing. Creation/relabel/deletion form one snapshot history. Undo/redo clears pending state before changing history; a fresh edit clears redo. Restoring valid payloads atomically replaces committed state, clears pending/active state, and starts a new empty history. Failed restore changes nothing.

Desktop labeling by scrolling ([plan 25](plans/25-ASSESSMENT-REMEDIATION.md) trigger rule, [18](plans/18-DESKTOP-HOVER-SCROLL-LABELING.md), [26](plans/26-HIERARCHICAL-AND-MULTI-RANGE-SELECTION.md)): a non-passive `wheel` listener on the document surface labels every pending range only when no dialog is open, neither Ctrl nor Meta is held, `deltaX !== 0 && deltaY === 0`, and the event point lies inside the client rectangles of any pending range, read at event time. It synchronizes the native range first and calls the shared `classify`: `deltaX < 0` assigns the left label, `> 0` the right. That event is canceled so the browser's history swipe cannot run, and so is the rest of the gesture: pure horizontal, non-Ctrl/Meta events within 200 ms (`CONTINUATION_GAP_MS`) of the last canceled one are canceled and never commit, so late momentum cannot label a newly made selection. Vertical, mixed-axis, zoom and other horizontal input is never canceled. Saved annotations are never relabeled by scrolling. The plan 07 pointer-drag swipe is retired: a press on pending text starts native text selection, and pointer drags never label. Native mouse selection and scoped keyboard selection share canonical anchors.

## Public API and events

`mountReview(container, {document: {id, version, markdown, title?}, labels: [{id, name, direction}], shortcuts?, styles?, exportFormat?, onFinish?})` returns `select(start,end)`, `clear()`, `activate(id)`, `relabel(id,labelId)`, `delete(id)`, `read()`, `restore(payloadOrSplitPayloadArray)`, `undo()`, `redo()`, `export(format?)`, `finish()`, `destroy()`, and `shortcuts` (a copy of effective mappings). Invalid input throws a useful error; UI commands announce errors and dispatch `review:error`.

Container events `review:create`, `review:update`, `review:delete`, and `review:selection` carry copied annotation/range data; `review:complete` carries exported data after a successful `onFinish(data)` promise. No promise rejection clears state or completes the session. Finish with pending text opens a label/discard dialog; dismissing it cancels completion. Destruction is idempotent, restores original container nodes, and removes owned listeners/highlights/UI. Mutations after destruction throw. Mounted instances use distinct highlight names and scoped commands.

Finish saves a snapshot. Concurrent finish calls share the same promise. If annotations change or a new pending selection appears while the host saves asynchronously, completion rejects with a retry message; the newer review remains intact and no stale completion event is emitted.

## Export schema v1

Grouped output: `{schemaVersion:1, document:{id,version,text,canonicalFormat:'review-text-v1',offsetUnit:'utf-16',endExclusive:true}, labels:[{id,name,direction}], selections:{[labelId]:[{id,documentId,documentVersion,labelId,start,end,quote,prefix,suffix}]}}`.

Both label groups exist, including empty ones. Sort by start, end, then ID. Split output is an array of two objects with the same metadata/label definitions and one selections group each. Restore accepts the grouped object or the full two-element split array, validates exact identity/version/text/format/labels, unique annotation IDs, positions, quotes/context, and group membership before committing. Returned objects never alias state. Export never modifies or includes pending state.

## Verification

`npm test`: state, serialization, validation, history, restore, styles/theme, file helpers, and static server request handling.
`npm run test:browser`: Chromium, Firefox and WebKit selection, rendering/sanitization, wheel labeling and pointer drags, keyboard, lifecycle, file loading, and downloaded label payloads.
`/tests/wheel-probe.html` (with `npm start`): plan 17 developer probe that tabulates wheel values over the pending range without labeling.
`npm start`: local-only HTTP server at `http://127.0.0.1:4173`. No backend persistence or external requests.

`npm run build`: the standalone offline app `dist/review.html`, self-contained ESM library `dist/review-lib.js`, and `dist/review.css`.
`npm run test:page`: a self-contained real-browser check page, useful when the environment blocks headless Chromium. See [actual verification results](VERIFICATION.md); this alternative does not claim OS input coverage.

## Displayed shortcut names

Visible shortcut hints and help expand the host's abstract `Mod` binding to **Cmd** on macOS or **Ctrl** on Windows/Linux. Explicit `Meta` overrides display as Cmd on macOS. Internal binding configuration and the `shortcuts` API still accept/return `Mod`; ARIA uses the standard `Meta`/`Control` names. Users must never be asked to find a keyboard key named Mod.

## Planned native-scroll and mobile interaction follow-up

Plans [17](plans/17-NATIVE-SCROLL-UX-PROTOTYPE.md)–[20](plans/20-INPUT-UX-ACCEPTANCE.md) document the user-requested correction: desktop hover over pending text plus native horizontal scrolling; no dragged-text/handle requirement, no custom diagonal classifier, no vertical-to-horizontal conversion, no native scrolling/zoom/navigation suppression. The desktop rule above is implemented; the 17 first-use study and native trackpad/mouse evidence remain open. Mobile native text selection and touch classification need a separate prototype and actual iOS/Android proof. No public label/export/restore schema or setup UI is added by this planning work.

## Widget presentation

Implemented from [plan 23](plans/23-WIDGET-HIGH-FIDELITY.md) with Export retained ([25](plans/25-ASSESSMENT-REMEDIATION.md)).

- **Navbar** — one row of fixed height (`navbarHeight`, 62px): document name (`document.title`, optional string, falling back to `document.id`), keyboard icon (`data-command="help"`, opens the same help as F1), ••• (`aria-expanded`, `aria-controls`) and Done (most emphasized). ••• swaps the name for the action strip in place and back; it never adds a row or moves the document. Narrow widths scroll the strip natively in that row.
- **Action strip** — every other command (`left`, `right`, `clear`, `remove`, `undo`, `redo`, `previousBlock`, `nextBlock`, `selectBlock`, `precise`, `previousAnnotation`, `nextAnnotation`, `export`) with configured label names, `title` and `aria-keyshortcuts` from the effective mapping. Toggling never selects, clears or labels. The first Escape while open collapses it (focus returns to ••• if it was inside) and keeps the target; the next Escape is the ordinary clear.
- **Whisper** — an absolutely positioned overlay in `.review-layout`, outside the document, centred in the uniform bottom spacing (`paragraphSpacing`, shared by every block) below the block holding the target's end. It never changes any block's margin or size, so document text never moves for it ([plan 26](plans/26-HIERARCHICAL-AND-MULTI-RANGE-SELECTION.md)), and caret movement and selection never enter it. A paper background keeps a wrapped row legible if it overlaps the next line. Its words are CSS generated content (`data-text`). Placement holds still while a pointer button is down (the overlay does not jump during a drag) and in precise mode stays under the caret's starting block; a `ResizeObserver` re-lays it after reflow. Derived on every paint from session state plus two presentation-only values (strip open, the annotation just labeled); no second committed store. Precedence: precise → `Selecting text`; pending → `← left`, `Unlabeled · scroll ← → over selection` (`· choose above` while the strip is open), `right →`; active saved → `✓ label · ••• to edit`; just assigned → `✓ label · {effective Undo} undo` with the matching end checked and underlined. Any `review:selection` transition (select, clear, activate, undo/redo, restore) ends the just-assigned confirmation; no timeout. Hidden when idle, after clear and after Undo. Below 500px container width the explanatory hint hides, leaving the state and both full label names (which wrap). The whisper is not a live region; the existing polite status line remains the single announcement channel.
- **Help** — keycaps for the effective platform mapping and actual label names; selection/navigation commands in a `<details>` section; Close button and Escape return focus without touching the target.

### Instance appearance

`mountReview(..., { styles })` takes partial named CSS values and exports `defaultReviewStyles` for inspection. Background and all visual token families use the approved defaults when omitted. Values are copied to the mounted root, including dialogs and highlights, without changing host-page styles or annotation data. Invalid maps/values reject before replacing host content. See [Styling](STYLING.md) for supported tokens and defaults.
