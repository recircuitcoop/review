# Selection and Swipe Annotation Library

Product and technical specification — initial version

Implementation details and local Markdown-file workflow: [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md). Small implementation plans: [docs/plans/README.md](docs/plans/README.md).

## Purpose

A JavaScript library that lets a user read a document rendered from Markdown, select portions of interest, and classify each selection by swiping left or right. At the end of the session, the user exports selections grouped by label.

The user chooses which passages to annotate. Unselected text remains unlabeled. The library supports arbitrary pairs of labels, such as Accept / Reject or Label A / Label B.

## 1. User interaction

### Start a session

The host application supplies a Markdown document and two preset labels, one for each swipe direction. The interface shows the document, the direction-to-label mapping, and a Done button. Label names remain visible during annotation.

### Select a portion

| Action | Behavior |
| --- | --- |
| Click a paragraph | Select its entire textual content. |
| Click a heading or subtitle | Select its entire textual content. |
| Click a list item | Select that item's entire textual content, including its nested content. A nested item click selects the nested item. |
| Click a fenced code block | Select the whole code block, preserving its whitespace. |
| Click and drag across text | Select exactly the resulting text range, including a range crossing formatting or paragraph boundaries. |
| Click outside the active selection | Clear the pending selection; select another supported block if applicable. |
| Press Escape | Cancel the pending selection. |

The active selection receives a distinct highlight. Selection alone does not assign a label or create a committed annotation.

Click and drag takes precedence over block selection. The library waits until the pointer is released to distinguish a click from a text-selection gesture. Empty selections are ignored.

### Assign a label

After establishing a selection, the user hovers its highlighted area and scrolls horizontally using the device's native input (trackpad, tilt wheel or Shift+wheel where the browser reports horizontal scrolling). This is the desktop “swipe”:

- Scrolling left assigns the configured left label.
- Scrolling right assigns the configured right label.
- Vertical, mixed-axis or zoom input, or input outside the pending highlight, leaves the selection pending.

The contextual whisper attached to the pending passage names both configured labels at their directions before assignment. The document layout remains stable. A multiline selection behaves as one item. Dragging that begins on highlighted text adjusts the native text selection; it never labels.

After a successful assignment, the library commits the annotation, colors the passage according to its label, and clears the active selection. The user can immediately select another passage.

Visible label buttons and keyboard actions provide equivalent classification without swiping. Undo reverses the latest committed annotation action.

### Desktop and mobile interaction correction

The user requested a UX correction after finding desktop pointer “swiping” unclear. The desktop flow is **select a passage → hover its pending highlight → scroll left/right using the device's native horizontal scrolling → assign that configured label**. Do not require dragging selected text or a desktop drag handle. Do not implement custom diagonal/axis-ratio recognition, convert vertical scrolling into labels, or suppress native scrolling, zoom or browser navigation. Ordinary mice without horizontal input retain the label buttons and keyboard alternatives. Only a pending selection can be labeled this way; saved text is not implicitly relabeled by scrolling.

Trigger rule ([plan 25](docs/plans/25-ASSESSMENT-REMEDIATION.md)): a `wheel` event over the exact pending-highlight rectangles whose `deltaX` is nonzero and `deltaY` is zero labels once (`deltaX < 0` left, `> 0` right). Events with Ctrl/Meta held never label. The library never cancels wheel events. A commit clears the pending range, so later events in the same stream do nothing. The user directed implementation of [18](docs/plans/18-DESKTOP-HOVER-SCROLL-LABELING.md) ahead of the [17](docs/plans/17-NATIVE-SCROLL-UX-PROTOTYPE.md) first-use study; that study and native-device evidence remain open, and no discoverability claim is made.

The separately requested mobile flow must preserve native long press, selection handles, vertical scrolling, pinch zoom and browser navigation. Its horizontal touch action needs its own prototype/capability decision and physical-device proof under [19 — Mobile selection and swipe](docs/plans/19-MOBILE-NATIVE-SELECTION-AND-SWIPE.md) and [20 — Input UX acceptance](docs/plans/20-INPUT-UX-ACCEPTANCE.md). Desktop wheel tests do not establish mobile support. Labels, document identity, export format and restored data remain configured through the existing host API; setup/file forms do not enter the mounted widget.

### Widget presentation

The approved high-fidelity appearance is the default styling contract. Hosts configure colours (including the widget background), buttons, typography, spacing, borders and other named style tokens once through `mountReview(..., { styles })`. Omitted values use the exported, immutable `defaultReviewStyles`. Configuration is scoped to each mounted widget and does not change host-page styles, annotation data or other instances. See [24 — Instance style configuration](docs/plans/24-INSTANCE-STYLE-CONFIGURATION.md). Styling changes do not imply the new native-input gates have passed.

The user selected **Inline whisper** for visual refinement: a discreet status attached to the passage explicitly shows `Selected · Not labeled yet` before classification and `Labeled · {actual configured label name}` afterward. Direction hints show both real label names, not generic left/right placeholders, and refresh from accepted host configuration changes. Swipe and keyboard remain primary; secondary controls, including **Export files**, swap into the fixed-height top navigation bar through ••• and swap back through that same button. The approved high fidelity is [23](docs/plans/23-WIDGET-HIGH-FIDELITY.md); the navbar shows the optional `document.title`, falling back to `document.id`. No setup forms are introduced. Supporting live label-name updates requires a specified host update path that preserves stable identities; current reset/restore safeguards remain in force until that work is implemented.

### Capabilities and keyboard shortcuts — initial release

All shortcuts below ship in the initial release. “Mod” means Command on macOS and Ctrl on Windows/Linux. Shortcuts apply only while focus is within the annotator. Every command also has a visible control or an entry in the keyboard-accessible annotation toolbar.

| Capability | Shortcut | Behavior / context |
| --- | --- | --- |
| Move between controls | Tab / Shift+Tab | Follow normal focus order; enter or leave the document surface without trapping focus. |
| Move to the next / previous selectable block | Alt+ArrowDown / Alt+ArrowUp | Focus the next / previous paragraph, heading, list item, or fenced code block without assigning a label. |
| Select the focused block | Enter | Create a pending selection for the entire focused block. On a focused button, Enter activates that button normally. |
| Select an exact text range | Shift+Arrow keys | Extend native text selection from the caret in document text-selection mode. |
| Extend selection by word | Ctrl+Shift+ArrowLeft/Right (Windows/Linux); Option+Shift+ArrowLeft/Right (macOS) | Preserve native word-selection behavior in text-selection mode. |
| Enter / leave precise text-selection mode | F2 | Enter browser caret navigation within the focused block, initially at its start; leaving retains a nonempty range as the pending selection. The document remains read-only. |
| Assign the left label | Alt+ArrowLeft | Label the pending selection, or relabel the single active saved annotation. |
| Assign the right label | Alt+ArrowRight | Label the pending selection, or relabel the single active saved annotation. |
| Remove the pending selection | Escape | Clear the pending range and its temporary highlight; leave committed annotations unchanged. |
| Deselect a saved annotation | Escape | Exit annotation editing without removing the annotation or its label. |
| Remove the active selection / saved annotation | Delete / Backspace | Discard a pending selection, or delete the single active saved annotation. Never alter document text. Saved deletion is undoable. |
| Activate next / previous saved annotation | Alt+N / Alt+P | Navigate in document order, using annotation ID as a stable tie-breaker for identical ranges; scroll the target into view. |
| Choose among overlapping saved annotations | ArrowUp / ArrowDown, then Enter | Move through the open overlap chooser and activate one annotation. Escape closes the chooser without a change. |
| Undo | Mod+Z | Reverse the latest committed creation, relabeling, or deletion. Cancel any pending selection first, then undo. |
| Redo | Mod+Shift+Z; Ctrl+Y on Windows/Linux | Reapply an undone committed change. Cancel any pending selection first, then redo. |
| Finish / Done | Mod+Enter | Run the same completion flow as the Done button, including resolution of pending selections. |
| Export files | Mod+Shift+E | Emit the committed export through the host without completing the session. Pending selections stay pending and are excluded. |
| Show shortcut help | F1 | Open the capability and shortcut reference within the annotator. Escape closes it. |

Keyboard selection uses the same range model and commit path as mouse selection. Moving focus alone does not remove an active range. Toolbar controls preserve the selection when focused or activated.

In precise text-selection mode, ordinary arrow keys move the caret and Shift+Arrow extends the range; they never classify text. The library supplies scoped caret navigation rather than requiring users to enable browser-wide caret browsing. Selection can extend across supported document blocks. Leaving the mode with F2 retains the current nonempty range; Escape cancels it.

When a menu or dialog is open, its navigation takes priority. Escape first closes that surface and only a subsequent Escape clears the underlying selection. Destructive commands act only on an explicitly active target; with no target, Delete and Backspace do nothing inside the document surface and do not navigate browser history.

Do not intercept shortcuts in editable fields, host application controls, or during IME composition. Prevent browser defaults only when handling an applicable annotator command. Hosts may remap conflicting shortcuts; controls and help must display the effective mapping. Verify the default mapping on supported browsers and operating systems before release.

### Finish

Done completes the session and produces the export payload. If a selection is still pending, the interface asks the user to label it or discard it before completion. A completed session may contain zero annotations.

Done automatically invokes the configured export/completion flow through the host. Keep the session available for retry if delivery fails. The mounted interface also keeps a separate **Export files** control and `Mod+Shift+E` shortcut for intermediate exports that do not complete the session (user decision, [plan 25](docs/plans/25-ASSESSMENT-REMEDIATION.md); supersedes plan 22's removal). The library's programmatic export API remains available to hosts.

The host application decides how to present downloads or save the returned data. Finishing must not silently lose annotations if saving fails; the current session remains available for retry.

### Reopen a saved review

The application provides an “Open saved review” flow. The user selects the unchanged original Markdown document and its saved annotations: one grouped JSON file or both split label JSON files. Saved metadata supplies the document identity/version and the label IDs, display names, and swipe directions; users do not have to recreate that configuration manually. File matching uses metadata rather than export filenames or selection order.

After validation, saved highlights and annotations are available for adding new selections, relabeling, deletion, undo/redo of new edits, and another export. Preserve unchanged annotation IDs and ranges. Re-export includes the full updated review, including unchanged annotations and both label files under the documented naming rule.

Validate the entire saved review before replacing any current session. Missing split files, incompatible documents or versions, conflicting metadata, malformed data, and mismatched quotes must leave the current review intact and produce a useful error. Protect current pending and committed work before replacement. A successfully reopened review begins a fresh edit history with restored annotations as its baseline. This guided application flow is tracked in [plan 15](docs/plans/15-REOPEN-SAVED-REVIEW.md).

### Night theme

Provide light and night appearances with a visible, keyboard-accessible theme toggle and an exposed accessible state. Follow the operating system color preference until the user selects an appearance; remember an explicit choice locally when storage is available. Preference storage failures must not prevent switching themes or reviewing a document.

Both appearances cover document text, code blocks, controls, dialogs, previews, native selection, and saved/pending/active annotation highlights. Meet WCAG AA contrast and keep label names and state indicators meaningful beyond color alone. Switching appearance preserves selections, annotations, history, focus, open dialogs, and export contents. Theme preference is presentation data and is not added to annotation exports. Implementation is planned in [plan 16](docs/plans/16-NIGHT-THEME.md).

### Proposed defaults requiring UX validation

- Clicking a committed highlight selects that annotation for relabeling or deletion; it takes precedence over selecting the containing paragraph.
- Beginning a new selection replaces the previous pending selection without committing it.
- Scrolling that does not qualify as labeling input leaves the pending selection active.
- Overlapping committed selections are supported. Each retains its own range and label. A newly selected range takes precedence as the horizontal-scroll labeling target. Clicking overlapping saved highlights opens a keyboard-accessible chooser for the annotation to edit; it never labels or deletes multiple annotations implicitly.
- Links inside the annotation surface do not navigate on ordinary selection clicks. The host may provide a separate way to open links.

These defaults complete the initial interaction contract. Local behavior validation covers replacement, saved-highlight precedence, the overlap chooser, canceled-swipe retention, and link-click suppression; see [core completion evidence](docs/CORE-COMPLETION.md). They remain proposed UX defaults rather than claimed user usability approval.

## 2. Features

### Initial release

- Render a supplied Markdown document as selectable HTML.
- Select entire paragraphs, headings, list items, and fenced code blocks with a click.
- Select exact contiguous text ranges with click and drag.
- Assign one of two preset labels through native left/right horizontal scrolling over the pending selection.
- Show both configured label names at their directions before assignment.
- Preserve visible highlights for committed annotations.
- Support overlapping selections with independent labels and an accessible overlap chooser.
- Remove a pending selection without labeling it.
- Relabel or delete an existing annotation.
- Undo and redo committed annotation changes.
- Provide label buttons and the complete initial-release keyboard shortcut map above, including precise selection, removal, navigation, export, and Done.
- Provide a visible shortcut reference and host-configurable shortcut remapping.
- Finish through a Done button.
- Export one JSON file grouped by label, or one JSON file per label.
- Restore annotations for the same document version.
- Reopen a saved review with its original Markdown and exported annotations, update annotations, and export the full revised review.
- Provide a light/night theme switch with readable annotation highlights and a locally remembered appearance preference.
- Expose annotation events and export data to the host application.

### Outside the initial scope

Collaborative editing, accounts, model suggestions, backend storage, mutable-document reattachment, image-region annotation, and more than two swipe labels are outside the initial release. Discontinuous selections are also excluded: one annotation represents one contiguous text range.

Desktop mouse and keyboard interaction on Windows, macOS, and Linux are the initial support targets. Verify current Chromium and Firefox on all three systems and Safari/WebKit where supported; platform-specific modifier maps must preserve equivalent behavior. Touch support uses the same selection-then-label model but needs a separately validated selection interaction using native long press and selection handles.

## 3. Specifications

### Input and rendering

The host supplies:

- A document ID and immutable version identifier or content hash.
- Markdown source.
- Exactly two labels with stable IDs, display names, and left/right assignments.
- Optional presentation settings, such as highlight colors.

Render Markdown as ordinary HTML inside an isolated annotation container. “Canvas” refers to the visual document surface, not an HTML canvas bitmap. Native HTML text provides selection, layout, and accessibility behavior.

Sanitize rendered HTML before inserting it into the document. The initial Markdown profile supports headings, paragraphs, emphasis, links, lists, blockquotes, and fenced code. Tables and custom HTML extensions require explicit support and selection tests before being advertised.

Click-to-select applies to paragraphs, headings, list items, and fenced code blocks. Clicking text inside a list item selects the nearest containing item; a code block inside an item selects the code block. Inline code follows its containing block. Exact drag selection still takes precedence. Keyboard block navigation and Enter use the same selectable blocks, without duplicate stops on paragraphs/headings inside a list item.

### Selection and gesture contract

Maintain only one pending selection at a time. A selection must be nonempty and remain within the annotation container. Ignore interface controls and non-document text when calculating ranges.

A gesture that establishes a range cannot label it. Labeling requires a separate native horizontal scroll over the pending highlight, under the trigger rule above. Vertical movement preserves normal scrolling and never labels. Pointer drags, including those beginning on highlighted text, only select text. Selection alone remains uncommitted, and all classification continues through one shared command. The original pointer-drag swipe prototype (plan 07) is retired; touch labeling is plan 19 work.

### Annotation identity and anchoring

Each committed annotation stores:

| Field | Purpose |
| --- | --- |
| Annotation ID | Stable identity for editing, deletion, and export. |
| Document ID and version | Identify the exact source document. |
| Label ID | Identify the assigned class independently of its display name. |
| Start and end | Locate the range in a defined canonical text representation; end is exclusive. |
| Exact quote | Preserve the selected text and verify restored positions. |
| Prefix and suffix | Provide context for inspection and potential future reattachment. |

Define canonical text as a deterministic traversal of the supported rendered document, with explicit rules for block separators and whitespace. Store the canonical-text format version with the export. Use UTF-16 code-unit offsets for the JavaScript-facing format and state that convention explicitly so downstream systems can convert it correctly.

Adapter code must translate any annotation dependency's positions into this contract; do not assume its offset rules match. Verify that each stored range resolves to its exact quote. Never silently restore an annotation onto a different document version or onto text that fails this check.

Offsets refer to canonical rendered text, not Markdown source positions. Reconstructing the original Markdown formatting for a selection is outside the initial export contract.

### Export

The default export contains document metadata, the canonical text, its format and offset conventions, the label definitions, and selections grouped by label ID. Each selection includes its annotation ID, range, quote, and context.

The optional split export produces a file for each label, including an empty list when that label has no selections. Each file includes sufficient document metadata and canonical text to interpret its offsets independently. Preserve document order within each group.

In the local application, split export must provide both files: `<file>_<leftlabel>.json` and `<file>_<rightlabel>.json`. Here `<file>` is the source filename without its final `.md` or `.markdown` extension, and each label is its configured display name, not its direction or stable ID. For `notes.md` with labels `Accept` and `Reject`, the filenames are `notes_Accept.json` and `notes_Reject.json`. Include both files even if one or both contain zero selections.

The host must make each file independently downloadable/retryable when browsers restrict multiple automatic downloads. Preparing two payloads or links alone does not prove both downloads occurred. Preserve annotations and pending state according to the export/completion contract. Filename safety and collision rules belong to the host; they must not change label IDs or JSON contents. The current right-only delivery report and naming correction are tracked in [plan 14](docs/plans/14-SPLIT-EXPORT-DELIVERY.md).

Export is a transformation of committed annotations. Pending selections are never exported. Unselected passages are never inferred to belong to either label. Export does not itself create an AI-training-specific format such as BIO tags.

### Public library surface

Provide a small framework-independent interface to mount the annotator, select or clear a range, activate/relabel/delete an annotation, read or restore annotations, undo/redo, export, finish, and destroy the instance. Expose effective shortcut mappings and allow host overrides. Destruction removes listeners and transient UI.

Expose events for annotation creation, update, deletion, selection changes, completion, and errors. Completion returns structured data; file downloads are a host concern, with an optional browser download helper.

The core operates in the browser without a backend. Session persistence is owned by the host through events and restore methods. Browser download APIs do not imply arbitrary filesystem write access.

### Accessibility and resilience

- Both labels have visible text and accessible names; color is supplementary.
- Every classification action is available through buttons and keyboard controls.
- Provide a keyboard-operable way to select whole blocks and use native keyboard text selection for precise ranges.
- Announce the active selection and completed label assignment to assistive technology without repeatedly reading the entire document.
- Respect reduced-motion preferences and maintain usable focus after labeling, undo, and completion.
- Resizing, line wrapping, scrolling, and font loading must not change annotation identity or text offsets.
- Changing the document or label configuration during a session requires an explicit reset or validated reload; it must not silently reinterpret annotations.

### Acceptance conditions

1. A paragraph, heading, list item, or fenced code block click selects that block, while dragging preserves the exact selected range.
2. A range crossing bold text, links, or paragraph boundaries exports the correct quote and positions.
3. Selection alone creates no labeled annotation; each qualifying horizontal scroll over pending text creates exactly one committed annotation with the correct label.
4. Pointer drags, vertical or mixed-axis scrolling and zoom input create no annotations.
5. Relabel, delete, undo, and redo produce consistent highlights and exports.
6. Done resolves pending selections and returns every committed annotation exactly once.
7. Export and restore on the same document version preserve identity, labels, positions, and quotes.
8. Repeated phrases, emoji, and non-Latin text resolve to the intended occurrence.
9. Resize and reflow preserve annotations; incompatible restore data is rejected with a useful error.
10. Buttons and keyboard interaction complete the same workflow without swiping, including block and cross-block precise selection.
11. Every shortcut in the capability table works in its documented context on supported desktop platforms; editable fields, IME composition, and host controls retain their normal behavior.
12. Escape removes a pending selection without deleting committed annotations. Delete/Backspace removes only the explicit active target, and saved deletion can be undone and redone.
13. Overlapping selections retain independent ranges and labels through editing, deletion, export, and restore; the chooser allows keyboard access to each one.
14. Shortcut help and control hints reflect host remapping. Focus remains usable after every keyboard action; document text is never editable.

## 4. Quick architectural view

```text
Host application
  supplies Markdown, document identity, labels, save behavior
          |
          v
Markdown renderer + HTML sanitizer
          |
          v
Selectable HTML document
          |
          +--> Text/annotation adapter
          |      block selection, native ranges, anchors, highlights
          |
          +--> Interaction controller
                 pending selection, swipe recognition, label preview
                 keyboard commands, focus and caret navigation
                          |
                          v
                  Annotation state
                 committed ranges + labels
                 edit history / undo / redo
                          |
                          v
                   Export serializer
                 grouped JSON or split JSON
                          |
                          v
                  Host save/download
```

### Recommended implementation approach

Evaluate [Recogito Text Annotator](https://github.com/recogito/text-annotator-js) as the annotation engine. It provides HTML text annotation, selection events, stored quotes and offsets, highlighting, and undo/redo facilities. Use the current successor project rather than the deprecated RecogitoJS package.

The library owns the product-specific behavior: block clicks, pending-versus-committed selection, swipe classification, completion, and export. A narrow adapter translates between the engine's model and the library's annotation contract. Choose one authority for committed state and undo history; do not maintain independent histories in both the engine and wrapper.

Before committing to the dependency, verify that it can support pending selections, programmatic whole-block selection, and gesture handling without prematurely committing annotations. If its creation events are provisional from the product's perspective, keep them out of committed exports and history until a label is assigned.

The interaction follows these states:

```text
Idle -> Pending selection -> Swipe preview -> Committed annotation -> Idle
              |                  |
              |                  +-- canceled --> Pending selection
              +-- canceled --> Idle

Done + no pending selection -> Export/completion
Done + pending selection -> Resolve pending selection first
```

### Key architectural invariants

- One document version defines the meaning of every stored range.
- Text identity is independent of screen geometry.
- A pending selection is not a labeled annotation.
- Each committed annotation has exactly one of the two configured labels.
- A classification gesture cannot also establish its own selection.
- All classification controls use the same commit path.
- Export derives from committed state and preserves enough context to identify each passage.

### First implementation checkpoint

Build a desktop proof of concept containing a formatted Markdown document, click and drag selection, swiping directly on an active highlight, two label buttons, the complete shortcut map, selection removal, overlap editing, undo/redo, shortcut help, Done, and JSON export. Validate gesture ambiguity and exact range round-tripping before expanding browser coverage or adding touch support.
