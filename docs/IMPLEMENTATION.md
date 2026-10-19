# Implementation contract

The seed remains [selection-swipe-library.md](../selection-swipe-library.md). This document fixes details needed by the small plans before implementation and tests.

## Local application

The host opens a user-selected `.md`/`.markdown` file using the browser File API. The filename identifies the document; SHA-256 of the unmodified Markdown identifies its immutable version. The host offers two label names (default Accept/Reject), explicit Start review, grouped or split export, restore from previously exported JSON, and Done. Changing file/labels requires starting a new session with an explicit confirmation if a review is already open. File text is never uploaded. Split export is the default and must provide two label files, including empty labels. Download failure leaves the review and both file controls available for retry. A browser cannot confirm that a user saved a download to disk.

## Host export delivery and filenames

Required split filenames are `<file>_<leftlabel>.json` and `<file>_<rightlabel>.json`, using the configured display names. Strip only the final Markdown extension, case-insensitively. Preserve valid spaces, case, and Unicode; normalize filename components to NFC. Replace filesystem-unsafe characters (`<>:"/\\|?*` and control characters) with underscores and strip trailing periods/spaces. Reject empty components or filenames that collide after sanitization/normalization and case-insensitive comparison, with a useful message and no loss of review state. Do not silently overwrite or append direction IDs to resolve collisions. These rules affect filenames only; document identity, label definitions, and grouped/split JSON remain unchanged.

Examples: `notes.md` + `Accept` / `Reject` → `notes_Accept.json` / `notes_Reject.json`; `chapter.v2.markdown` + `Keep` / `Needs review` → `chapter.v2_Keep.json` / `chapter.v2_Needs review.json`.

Prepare both payloads and object URLs before offering split delivery. Each file needs a clearly named, independent user-activated download/retry control; completion must not depend on browsers permitting multiple automatic clicks in one handler. Keep both available until the review changes or the user leaves. Use “files ready” rather than claiming disk-save success. Export files, Done, and their shortcuts share this host path. Grouped export continues to produce one file.

Implementation status: the serializer produces two payloads, but the current host automatically clicks both anchors in one handler and names files with direction IDs. The user reports only the right file arriving. Reliable split delivery and the label-based names above are **not implemented yet**; [plan 14](plans/14-SPLIT-EXPORT-DELIVERY.md) owns the fix and actual-download regression proof.

## Reopen a saved review

The guided host flow accepts the original Markdown and either one grouped JSON export or both split JSON exports. Existing exports contain canonical rendered text; the original Markdown supplies the formatted source. Use the saved document identity/version and both label definitions to configure a candidate annotator, then invoke the existing validated `restore` method. Require the source filename/identity and content hash to match the saved document. Validate consistent metadata across both split files, irrespective of filenames or selection order.

Do not infer an empty label from a missing split file. Present a useful request for its partner. Parsing, hashing, mount, and restore must all succeed before replacing a current review; malformed or incompatible input leaves current annotations, pending selection, history, and download controls intact. If an existing review would be replaced, protect the user's unsaved work and allow cancellation before the swap.

After reopening, preserve annotation IDs, labels, exact anchors, and overlaps. Restored annotations form a fresh history baseline; subsequent creation, relabeling, and deletion use the same commands/history as a new review. Re-export includes the entire current committed state, including unchanged annotations, in the selected grouped/split format and with plan 14's label-based filenames. File contents stay local.

Current status: the library and the application's manual “start review, then restore” path already exist. The guided opening flow, automatic configuration from saved metadata, and its full reopen/edit/download tests are pending in [plan 15](plans/15-REOPEN-SAVED-REVIEW.md). Reuse the existing JSON schema and restore validation; no new persistence service or format is required.

## Night theme

Planned in [plan 16](plans/16-NIGHT-THEME.md). A host-owned light/night toggle follows `prefers-color-scheme` until an explicit local preference exists. Store only `light` or `dark` under a theme-specific preference key; wrap preference reads/writes so restricted storage on offline file origins cannot break review. Without persisted state, retain the chosen appearance for the current page. Observe system changes while the user has not overridden them.

Use CSS color variables for both host UI and the embedded library. Existing custom-highlight rules in `src/review.js` must consume those variables instead of their fixed colors. Include left/right, pending, active, and native selection colors plus readable code blocks, dialogs, previews, controls, and focus rings. Set the appropriate `color-scheme` so native form controls match. The embedded library inherits the host's variables without adding a public theme configuration API.

Switch appearance in place. Do not replace document nodes, remount, clear selection/history, alter canonical text, or change exported annotation data. Verify WCAG AA text/control contrast and non-color state cues. This is a pending feature; the current application has light styling only.

## Dependency and browser decision

Use Marked for Markdown and DOMPurify for sanitization; installed package documentation is the API reference while network/DNS is unavailable. Recogito cannot be fetched/evaluated in this environment and is not adopted. Native DOM Range/Selection, CSS Custom Highlight, and pointer events provide selection, overlapping highlights, and gesture recognition without an engine-owned second annotation store. The library owns all committed state and history. Initial automated target: Chromium desktop with CSS Custom Highlight and Selection.modify. Actual OS shortcut delivery and assistive technology require manual validation before broader support claims.

## Canonical text v1

Traverse sanitized document text nodes in DOM order. Preserve text-node whitespace exactly; represent `<br>` as LF. Append LF after each paragraph, heading, list item, blockquote, and preformatted block, collapsing adjacent structural separators only. Ignore whitespace-only nodes between block elements (not whitespace inside a paragraph or code). Strip trailing structural separators, not literal text whitespace. Inline markup adds no separator. The fixture `# Hi\n\nOne **two**.\n\nNext.` becomes `Hi\nOne two.\nNext.`. Code whitespace remains literal. DOM endpoints map to UTF-16 code units; end is exclusive. Generated structural separators participate in cross-block ranges. Context is up to 32 code units immediately before/after the range. UI/highlights never enter canonical text. Empty, fractional, nonfinite, reversed, and outside ranges are invalid.

## State, gestures, and editing

Core completion rules: a nonempty native drag range takes precedence over block-click selection even below the pointer-distance tolerance. Keyboard commands prevent browser defaults only when their operation is applicable. In particular, left/right classification with no pending or saved target must not consume its shortcut; Delete/Backspace inside the document remains intentionally handled even without a target. Canceling a swipe closes its preview first and preserves the pending selection; a later Escape clears that selection.

Selectable blocks include paragraphs, headings, list items, and fenced code blocks. A list item owns clicks on its child paragraphs; the nearest nested list item or fenced code block takes precedence. Clicking code preserves indentation and line breaks. Keyboard block navigation/Enter use the same block set, without duplicate stops on child paragraphs. Exact drag selection remains exact.

One pending selection and at most one active saved annotation exist. Selecting a new range replaces pending state and deselects the saved target. Clicking a saved highlight activates it before block selection; overlaps open a keyboard-accessible chooser. Ordinary document link clicks select text without navigating. These are prototype defaults from the seed, subject to human UX validation.

All classification paths call the same state command. Pending selection takes precedence, then the active saved target; no target does nothing. Creation/relabel/deletion form one snapshot history. Undo/redo clears pending state before changing history; a fresh edit clears redo. Restoring valid payloads atomically replaces committed state, clears pending/active state, and starts a new empty history. Failed restore changes nothing.

Swipe requires a separate gesture beginning on a pending highlight. Commit at horizontal release displacement >=60 CSS pixels and >=1.5 times vertical displacement. Under-threshold, vertical, canceled, or Escape-canceled gestures retain pending state and never commit. Preview represents the whole range in a fixed overlay; document layout stays unchanged. Native mouse selection and scoped keyboard selection share canonical anchors.

## Public API and events

`mountReview(container, {document: {id, version, markdown}, labels: [{id, name, direction}], shortcuts?, exportFormat?, onFinish?})` returns `select(start,end)`, `clear()`, `activate(id)`, `relabel(id,labelId)`, `delete(id)`, `read()`, `restore(payloadOrSplitPayloadArray)`, `undo()`, `redo()`, `export(format?)`, `finish()`, `destroy()`, and `shortcuts` (a copy of effective mappings). Invalid input throws a useful error; UI commands announce errors and dispatch `review:error`.

Container events `review:create`, `review:update`, `review:delete`, and `review:selection` carry copied annotation/range data; `review:complete` carries exported data after a successful `onFinish(data)` promise. No promise rejection clears state or completes the session. Finish with pending text opens a label/discard dialog; dismissing it cancels completion. Destruction is idempotent, restores original container nodes, and removes owned listeners/highlights/UI. Mutations after destruction throw. Mounted instances use distinct highlight names and scoped commands.

Finish saves a snapshot. Concurrent finish calls share the same promise. If annotations change or a new pending selection appears while the host saves asynchronously, completion rejects with a retry message; the newer review remains intact and no stale completion event is emitted.

## Export schema v1

Grouped output: `{schemaVersion:1, document:{id,version,text,canonicalFormat:'review-text-v1',offsetUnit:'utf-16',endExclusive:true}, labels:[{id,name,direction}], selections:{[labelId]:[{id,documentId,documentVersion,labelId,start,end,quote,prefix,suffix}]}}`.

Both label groups exist, including empty ones. Sort by start, end, then ID. Split output is an array of two objects with the same metadata/label definitions and one selections group each. Restore accepts the grouped object or the full two-element split array, validates exact identity/version/text/format/labels, unique annotation IDs, positions, quotes/context, and group membership before committing. Returned objects never alias state. Export never modifies or includes pending state.

## Verification

`npm test`: state, serialization, validation, history, restore, swipe boundaries, and static server request handling.
`npm run test:browser`: real Chromium selection, rendering/sanitization, gestures, keyboard, lifecycle, file loading, and downloaded label payloads.
`npm start`: local-only HTTP server at `http://127.0.0.1:4173`. No backend persistence or external requests.

`npm run build`: the standalone offline app `dist/review.html`, self-contained ESM library `dist/review-lib.js`, and `dist/review.css`.
`npm run test:page`: a self-contained real-browser check page, useful when the environment blocks headless Chromium. See [actual verification results](VERIFICATION.md); this alternative does not claim OS input coverage.
