# Review

A local Markdown review app and framework-independent browser library. Select a passage, assign either of two labels, and download one JSON file per label. Unselected text stays unlabeled.

**Open export issue:** split export can deliver only the right-side download, and current filenames use direction IDs. [Plan 14](docs/plans/14-SPLIT-EXPORT-DELIVERY.md) documents the pending fix. The required filenames below describe the target behavior, not a completed change.

## Use the app

Open [dist/review.html](dist/review.html) in a current desktop browser supporting CSS Custom Highlight and `Selection.modify`. This single file includes its dependencies and runs offline without a server. Chromium 143 and Safari 26.3.1 on macOS pass the browser check page; native Windows/Linux and Firefox verification are pending. The [repository setup and CI matrix](docs/REPOSITORY.md) targets all three operating systems and all three browser engines.

1. Choose a Markdown file, name the two labels, and click **Start review**.
2. Click a paragraph, heading, list item, or fenced code block; or drag an exact text range. Selection alone saves nothing. Code selection preserves indentation and line breaks.
3. Click a label, use Alt+Left/Right, or make a separate horizontal swipe on the pending highlight. The sidebar shows saved annotations.
4. Use **Done** or **Export files**. Split export must provide `<file>_<leftlabel>.json` and `<file>_<rightlabel>.json`, including an empty file for an unused label. For `notes.md` with `Accept` / `Reject`, these are `notes_Accept.json` and `notes_Reject.json`. The label-based naming and reliable delivery fix is pending.
5. If your browser blocks automatic downloads, use the individual download links. Re-export after changing annotations; stale links are removed automatically.

**Done** asks you to label or discard pending text before completion. **Export files** excludes pending text and keeps it selected. Saving never clears the review. Browsers cannot confirm that a download reached disk; keep the tab open until you have your files.

To resume, open the exact same Markdown file with the same label names, start a review, then select both saved label JSON files under **Restore label JSON files**. A grouped export can be restored by itself. Version or quote mismatches are rejected before changing the session.

Planned improvement: **Open saved review** will accept the original Markdown plus saved JSON and restore the saved label configuration automatically. You can then add, relabel, or delete annotations and export the full revised review. The existing restore engine will be reused; the guided flow is pending in [plan 15](docs/plans/15-REOPEN-SAVED-REVIEW.md).

Exports contain the full canonical rendered text as well as selected quotes and UTF-16 positions. Document source and labels stay in the browser; there are no upload calls, accounts, or backend storage. Closing/reloading discards in-memory changes unless exported.

## Keyboard and editing

Night theme is planned in [plan 16](docs/plans/16-NIGHT-THEME.md): a light/night switch, initial system preference, a remembered manual choice, and accessible annotation colors. It is not implemented yet.

Use **Shortcut help** for the effective mapping. Alt+Up/Down navigates blocks; Enter selects a focused block. F2 enables read-only caret navigation: arrows move, Shift+arrows extend (including across blocks), F2 keeps the range, and Escape cancels. Toolbar buttons preserve the range.

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
    document: { id: 'notes.md', version: 'immutable-content-hash', markdown: '# Notes\n\nA passage.' },
    labels: [
      { id: 'keep', name: 'Keep', direction: 'left' },
      { id: 'drop', name: 'Drop', direction: 'right' },
    ],
    exportFormat: 'split',
    onFinish: async payloads => { /* Save both payloads; reject on failure to allow retry. */ },
  });
  // review.export('split') returns two independent JSON payloads.
  // review.destroy() removes the UI/listeners and restores the original host nodes.
</script>
```

The `review:export` event lets hosts handle exports requested without finishing. See the [public API and export schema](docs/IMPLEMENTATION.md#public-api-and-events) for all methods and events. The demo's browser download helper stays in the host app.
