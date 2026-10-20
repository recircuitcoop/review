# Development verification

Date: 2026-10-19. The records below describe observed checks; they do not establish that all release requirements are complete.

## New swipe UX planning (2026-10-20)

The user clarified that desktop swiping is undiscoverable and rejected a desktop dragged-text/handle proposal. The preferred prototype is hover over pending selected text plus native horizontal scrolling, letting OS/browser scrolling remain native and adding no custom diagonal classifier. Joint UX-expert/senior-frontend source review informed [plans 17–20](plans/17-NATIVE-SCROLL-UX-PROTOTYPE.md). They are **planned only**: no gesture implementation, new device tests or user study was performed. Mobile remains unverified. Plan 07's old pointer proof does not establish the new desktop UX or mobile acceptance; 13's desktop interaction gate remains open.

## Current status after GitHub connection

Public repository: [recircuitcoop/review](https://github.com/recircuitcoop/review). The user pushed `df33471`; authenticated GitHub browser access published the file-opening fix `634796e` and rebuilt offline bundle `e828842`. [CI run 3](https://github.com/recircuitcoop/review/actions/runs/39318606377) **passed all nine jobs** on Windows/Linux/macOS × Chromium/Firefox/WebKit. Each job passed 17 Node tests, the build and the initial 10 browser tests, including two actual label downloads and restore. Playwright 1.58.2 pins Chromium 145.0.7632.6, Firefox 146.0.1 and WebKit 26.0; these are the package download manifest versions, not a claim that Safari itself ran on Windows/Linux.

Later local implementation includes night theme and concrete Cmd/Ctrl display names. The latest recorded local results are **21 Node tests**, **31 core browser checks** and **9 host checks**; browser pages passed in Chromium 143.0.7499.4 and Safari 26.3.1 on macOS. The shortcut-label regression was observed failing (30/31) before the display fix. Host checks use captured descendant events, real File/DOM/Range APIs and local blob payload reads; actual updated-download tests have been added separately.

The expanded Playwright suite discovers **48 cases** across three engines (16 per engine), including full core checks, grouped/split saved-review download round trips, system theme emulation, persistence, native keyboard activation and blocked storage. **It has not yet run in CI.** The earlier green run does not cover these unpublished changes. Local Git refs still point at `df33471` until fetched; do not read a local “synced” indicator as proof that remote `main` has no newer commits.

Plan 14 is complete. Plans 15/16 are implemented and locally verified, awaiting expanded CI and the remaining native accessibility checks. Plan 13 remains open for those final integrated results, OS-reserved shortcut delivery and targeted screen-reader announcements. Core implementation and plan 01–12 historical evidence remain valid within their recorded scope.

## Earlier records

The sections below describe earlier checkpoints. They do not override the current status above.

## Core plans 01–12 completion

The [completion audit](CORE-COMPLETION.md) closes every checklist item in plans 01–12 with local evidence. The final browser page reports **30/30 passed** in Chromium 143.0.7499.4 and Safari 26.3.1 on macOS; **12/12 Node tests** and the offline app/library build pass. New regressions cover exact tiny drags, no-target defaults, every toolbar command, overlap priority, all completion choices, and gesture cancellation/reversal/duplicate release. Trusted pointer checks cover both directions, full multiline preview, stable layout, short/vertical drags, injected cancellation/destruction, wheel scrolling and reduced motion. Native Enter/Escape/Tab checks supplement dispatched keyboard tests.

Plans 13–16 remain open. Results below include earlier milestones; the audit above is the current core status.

## List/code selection and cross-platform follow-up

The shared block-selection boundary now includes list items and fenced code blocks. Clicking a loose-list paragraph selects its containing item; nested items and code blocks select the nearest appropriate block. Keyboard navigation uses the same blocks without duplicate stops. Exact code ranges and code whitespace are preserved. Both new regression checks were demonstrated failing before the selector fix.

The current browser page passes **22/22** checks in **Chromium 143.0.7499.4** and **Safari 26.3.1**, both on macOS. This includes list/code click handling, code keyboard selection, exact partial ranges, and simulated Win32/Linux/MacIntel modifier routing (undo, both redo variants, scoped export, and native word selection). These are real browser-engine tests with simulated platform detection, not native Windows/Linux execution. The Node suite remains **12/12 passing**, including Windows-style path separator handling in the server; its command no longer depends on Unix shell glob expansion.

Playwright now defines Chromium, Firefox, and WebKit projects. Test discovery confirms **30 cases** across the three projects. [.github/workflows/review.yml](../.github/workflows/review.yml) adds a nine-job Windows/Linux/macOS × browser matrix for the requested `recircuitcoop/review` repository. Native Firefox 146.0.1 was downloaded from the official Playwright CDN but could not be launched by the computer-use tool (two timeouts). Native Firefox and Windows/Linux results are pending.

Repository initialization failed because the sandbox blocks `.git` creation. GitHub CLI access failed, and an elevated network check was rejected because escalation is disabled. No remote repository creation, local origin configuration, push, or CI run is claimed. [Repository setup](REPOSITORY.md) contains the exact requested remote and setup commands for an unrestricted session. The earlier results below record the initial delivery and remain useful history.

## Results

| Check | Evidence |
| --- | --- |
| Clean dependency install | `npm ci --offline --full-metadata --cache /tmp/review-npm-cache --no-audit --no-fund` passed using cached registry packages. Standard `npm ci` is documented for connected environments. |
| State, validation, serialization, gestures, static serving | `npm test`: **12/12 passed**. Includes threshold boundaries, atomic restore, property-order independence, copied data, commit event consistency, both actual browser-downloaded fixtures, `.mjs` MIME types, and hidden/path traversal rejection. |
| Deliverable build | `npm run build` passed: `dist/review.html`, `dist/review-lib.js`, `dist/review.css`. The built library imports with a `mountReview` export. |
| Real browser DOM/lifecycle checks | `npm run test:page` generated `test-results/browser-check.html`; Safari **26.3.1**, macOS **26.3.1**, visibly reported **19/19 passed** after final fixes. Source: `tests/browser-check.js`. |
| Actual file input and downloads | Opened the standalone app, selected `tests/fixtures/review.md` via the system file picker, labeled two paragraphs, and used Done. Safari required download permission; the individual retry link recovered the initially blocked first download. Both `review.left.json` and `review.right.json` were read from Downloads and validated/restored together. Copies: `tests/artifacts/browser-left.json` and `browser-right.json`. |
| Actual mouse/keyboard interaction | Paragraph selection alone left annotation count unchanged. F2 + Shift+arrows selected `Emoj`; Alt+Left committed it. A separate right swipe committed a quoted paragraph once; a short gesture on a selected range did not commit. An overlapping `Keep` range opened the chooser; Down/Enter selected one saved annotation, Backspace deleted only that target, and Command+Z restored it. |

The 19 browser-page checks cover canonical strings and DOM round trips, supported Markdown/sanitization, pending/committed state and copied events, native cross-format ranges, overlapping history, grouped/split restore, reflow, effective shortcut remapping/hints/help, invalid mount options, scoped block/saved commands, toolbar focus, editable/IME guards, precise cross-block selection, pending resolution, save failure/retry, concurrent-save edits, lifecycle cleanup, and multiple instances.

Regressions were demonstrated failing before fixes for toolbar focus, metadata property-order restore, creation event state, missing server/module handling, and asynchronous save edits. Application changes remove stale download links so old export snapshots cannot appear current after annotation edits; that host behavior is also asserted in the Playwright workflow.

## Remaining verification limits

- `npm run test:browser` could not start its server: sandbox returned `listen EPERM` for `127.0.0.1:4173`. A direct headless Chromium launch was also blocked by macOS Mach-port sandbox restrictions. The Playwright suite is present but **has not passed here**. Server request handling was exercised without binding a socket; the standalone app bypasses the need for a server.
- Browser-page tests call real DOM APIs and command handlers but do not prove every physical OS shortcut, pointer cancellation, or browser default. The specific real-input checks above supplement them. Windows/Linux modifier maps, all default shortcuts across browsers, assistive-technology announcements, and broader browser coverage remain release-gate work.
- Recogito could not be downloaded/evaluated because network DNS was unavailable. The native implementation passed the recorded checks; no Recogito compatibility is claimed. Prototype defaults still need user UX feedback; touch remains outside initial scope.
- Caveman is installed/configured, but its command hook reports its compression engine unavailable and passes output through. TOKF works with `TOKF_DB_PATH=/tmp/review-tokf.db`. Serena is active/ready and MemPalace is available. Codebase Memory remains unindexed: its worker fails daemon coordination, including a retry after source was added.

Plans 01–12 are complete for core/local acceptance with the [updated evidence](CORE-COMPLETION.md). Plan 13 remains partially verified until the cross-platform and assistive-technology checks pass; the local file-to-label workflow is usable now.

## Instance style configuration

Plan 24: 24/24 Node tests; native macOS Safari 4/4 style checks, 31/31 core browser checks and 9/9 host checks. Verified background defaults/overrides, two isolated differently styled instances, fonts/spacing/borders/buttons, host style preservation, stable annotation anchors/history, dialog/highlight token inheritance, DOM restoration and rejection before host replacement. Every public CSS token has a consumer. Build and self-contained browser-check generation succeed. These checks do not establish new Windows/Linux, other-engine or native swipe acceptance. Codebase Memory indexing remains unavailable because daemon coordination could not be verified safely; named-source reads were used.

### Full browser-suite rerun attempt

Requested rerun: `npm test` and `npm run test:browser` (Chromium, Firefox, WebKit). Unit tests: 24/24 pass. Playwright exited before executing browser tests because its local web server could not bind `127.0.0.1:4173`: `listen EPERM: operation not permitted`. All three browser projects are blocked/unrun for this attempt. Earlier native Safari evidence remains separate; it does not establish a successful full-suite rerun. Run `npm run check` in a terminal or CI environment permitting a local HTTP listener to complete this verification.

### Merge verification follow-up

With escalation enabled, full browser verification can run. Initial failures exposed test-harness assumptions: hosted CSP prevents test-only fetches of blob download URLs, and macOS WebKit may return decomposed Unicode download filenames. Read created Blob contents directly in the in-page harness, preserve real download tests, and compare suggested filenames after NFC normalization. Keep the production CSP unchanged. Install the pinned Firefox binary before the complete rerun.

### Full local suite now passing

After enabling authorized escalation, installing pinned Firefox, and correcting only the harness assumptions above: `npm run check` passes 24/24 Node tests and 51/51 Playwright tests across Chromium, Firefox and WebKit on macOS. Build and browser-check page generation pass. This supersedes the earlier sandbox-blocked rerun. Remote nine-job cross-platform CI remains the separate source of Linux/Windows evidence.
