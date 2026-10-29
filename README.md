# Review

A local Markdown review app and framework-independent browser library. Select a passage, assign either of two labels, and download one JSON file per label. Unselected text stays unlabeled.

**Status:** split export delivery and filenames passed all nine CI jobs. Saved-review opening, night theme, and Cmd/Ctrl shortcut labels are implemented with local browser checks; their expanded cross-platform CI verification is pending. See the [current plan status](docs/plans/README.md).

## Use the app

Open [dist/review.html](dist/review.html) in a current desktop browser supporting CSS Custom Highlight and `Selection.modify`. This single file includes its dependencies and runs offline without a server. Chromium 143 and Safari 26.3.1 on macOS pass the local browser check pages. The initial CI suite passed on Windows/Linux/macOS with Chromium/Firefox/WebKit; newer feature tests still await that matrix. The [repository setup and CI matrix](docs/REPOSITORY.md) targets all three operating systems and all three browser engines.

1. Choose a Markdown file, name the two labels, and click **Start review**.
2. Click a paragraph, heading, list item, or fenced code block; or drag an exact text range. Selection alone saves nothing. Code selection preserves indentation and line breaks.
3. Hover the pending highlight and scroll left or right (trackpad, tilt wheel, or Shift+wheel where the browser reports horizontal scrolling), use Alt+Left/Right, or open **•••** and click a label. A small whisper below the passage names both labels at their directions, then confirms the assigned label with the Undo shortcut. Dragging always selects text; it never labels. The sidebar shows saved annotations.
4. Use **Done** or **Export files** (in the ••• action strip, or Cmd/Ctrl+Shift+E). Split export provides `<file>_<leftlabel>.json` and `<file>_<rightlabel>.json`, including an empty file for an unused label. For `notes.md` with `Accept` / `Reject`, these are `notes_Accept.json` and `notes_Reject.json`.
5. Click each named download link to save both files; downloads are explicit rather than automatic. Re-export after changing annotations; stale links are removed automatically.

**Done** asks you to label or discard pending text before completion. **Export files** excludes pending text and keeps it selected. Saving never clears the review. Browsers cannot confirm that a download reached disk; keep the tab open until you have your files.

To resume, use **Open saved review** with the unchanged original Markdown and one grouped JSON or both label JSON files. Saved label names and IDs are restored automatically. Invalid or incomplete input leaves the current review intact; successful replacement requires confirmation when a review is already open. Edit/add/delete annotations and export the full updated review. The manual restore control is also available. New actual updated-download round trips await CI verification.

Exports contain the full canonical rendered text as well as selected quotes and UTF-16 positions. Document source and labels stay in the browser; there are no upload calls, accounts, or backend storage. Closing/reloading discards in-memory changes unless exported.

## Keyboard and editing

Use **Night theme** to switch appearance. The app follows the system preference until you choose a theme and remembers that choice when storage is available. Theme changes preserve review data and selection. Local contrast/state checks pass; expanded CI and native screen-reader verification remain pending.

The keyboard icon in the top bar (or F1) opens shortcut help with the effective mapping: **Cmd** on macOS and **Ctrl** on Windows/Linux. Alt+Up/Down navigates blocks; Enter selects a focused block. F2 enables read-only caret navigation: arrows move, Shift+arrows extend (including across blocks), F2 keeps the range, and Escape cancels. **•••** swaps the document name for every other command in the same row; Escape closes it first. Opening the strip or help preserves the range.

Click a saved highlight or sidebar entry to edit it. Overlapping highlights open a chooser; arrows and Enter choose one annotation. Delete removes the explicit active target; Undo/Redo restore committed changes. All labeling paths use one state/history owner.

## Develop

Node 22 or newer:

```sh
npm ci
npm test
npm run build
npm start
```

The optional development server listens only on `http://127.0.0.1:4173`. Use `PORT` to change its port. Source lives in `src/`: `model.js` owns annotations/history/export/restore, `text.js` owns canonical anchors, `review.js` owns browser interaction, and `app.js` owns file loading/downloads.

For automated browser checks, install the engines once with `npx playwright install chromium firefox webkit`, then run `npm run test:browser`. The suite targets all three engines and tests Windows/Linux and macOS modifier routing. Run it on the supported operating systems to verify physical shortcut delivery as well. `npm run check` runs unit and Playwright tests. If an environment cannot launch headless browsers, `npm run test:page` builds [test-results/browser-check.html](test-results/browser-check.html); open it in a desktop browser for repeatable DOM/interaction checks. This does not replace real pointer and OS shortcut checks.

The detailed [contract](docs/IMPLEMENTATION.md), [verification record](docs/VERIFICATION.md), [seed](selection-swipe-library.md), and [small plans](docs/plans/README.md) document behavior and remaining validation.

## Embed the library

Build first, then serve the generated JS and CSS with your host application:

```html
<link rel="stylesheet" href="/dist/review.css">
<div id="review"></div>
<script type="module">
  import { mountReview } from '/dist/review-lib.js';
  const review = mountReview(document.querySelector('#review'), {
    document: { id: 'notes.md', title: 'Project notes', version: 'immutable-content-hash', markdown: '# Notes\n\nA passage.' }, // title is optional; the navbar falls back to id.
    labels: [
      { id: 'keep', name: 'Keep', direction: 'left' },
      { id: 'drop', name: 'Drop', direction: 'right' },
    ],
    styles: { background: '#fff8ed', documentFontSize: '18px' }, // Optional; approved defaults when omitted.
    exportFormat: 'split',
    onFinish: async payloads => { /* Save both payloads; reject on failure to allow retry. */ },
  });
  // review.export('split') returns two independent JSON payloads.
  // review.destroy() removes the UI/listeners and restores the original host nodes.
</script>
```

The `review:export` event lets hosts handle exports requested without finishing. See the [public API and export schema](docs/IMPLEMENTATION.md#public-api-and-events) for all methods and events. The demo's browser download helper stays in the host app.

Configure the widget once through `styles` at instantiation, including its background, colours, buttons, fonts, spacing and borders. Omit `styles` to use the approved appearance. Import `defaultReviewStyles` to inspect the frozen default map. See [Styling](docs/STYLING.md) for the complete reference and appearance settings.
