# Development verification

## Current status

Date: 2026-10-30. Branch: `feat/hierarchical-multi-selection`. Command: `CI=1 npm test` and `CI=1 npx playwright test` (the `npm run check` stages) run locally; exit code 0. A developer `npm start` held port 4173, so the Playwright stage ran through a scratch config that only moved the server to port 4174.

| Check | Result |
| --- | --- |
| Node tests (`npm test`: model, server, files, theme, styles) | **28/28 passed** |
| Playwright cases (`npm run test:browser`) | **111/111 passed**: 37 per engine across Chromium, Firefox and WebKit, including real-mouse heading/list hierarchy clicks, Shift+click/Shift+drag append, one-swipe batch labeling with a single undo, wheel cancellation (`defaultPrevented`) cases, block geometry unchanged by click/Shift+click/label/undo, click-then-swipe with the pointer unmoved, and swipes in place after clicks away from the text (right edge, short last line, code padding, gaps inside a section). |
| Browser-check page (inside `host.spec.js`) | **41/41** in each engine, with the wheel checks updated to the cancellation contract |
| Browser-check page (`npm run test:page`) | Builds `test-results/browser-check.html`; generation succeeded. It was not opened in a browser for this record. |
| Host and style checks | Run inside the Playwright suite above (`host.spec.js`, `styles.spec.js`); the reporter prints case counts, not in-page check counts. |

Environment: macOS (Darwin 25.3.0), Node v22.18.0, Playwright 1.58.2 with Chromium 143.0.7499.4, Firefox 146.0.1 and WebKit 26.0 (Playwright's engine builds, not Safari itself).

Changed in plan 26 ([26](plans/26-HIERARCHICAL-AND-MULTI-RANGE-SELECTION.md)): qualifying horizontal wheel input over pending text and its 200 ms continuation are canceled (fixes the left swipe navigating back); a heading click selects its section and a list item its nested hierarchy; Shift+click/drag appends pending ranges that one label commits together as one undo step. After verifier review the whisper became layout-neutral (an overlay that never moves text; paragraphs and code blocks have 32px bottom spacing to hold it), heading sections end at the last content before the next heading, and a pending range's swipe hit area covers whole selected blocks and the gaps inside a selected section.

Changed in plan 25 ([25](plans/25-ASSESSMENT-REMEDIATION.md)): Export kept as a user-facing action alongside Done; native horizontal-scroll labeling over the pending highlight replaced the pointer swipe; hi-fi navbar, contextual whisper and keycap help are in production; the controller was split; assessment defects were fixed.

- CI matrix: [run 40967319567](https://github.com/recircuitcoop/review/actions/runs/40967319567) on `647162e` **passed all nine jobs** (Windows/Linux/macOS × Chromium/Firefox/WebKit). Independent verification found and then confirmed the fix for a whisper caret-navigation defect in precise mode.
- Not verified: native back/forward history-swipe suppression on macOS with Magic Mouse/trackpad in Chrome, Safari and Firefox (manual check in plan 26; Playwright can only prove `defaultPrevented`); first-use study (plan 17); native trackpad/mouse wheel delivery and momentum (18); mobile and physical devices (19/20); screen-reader announcements and OS-reserved shortcuts (13).
- Closed: late wheel momentum no longer labels a newly made selection (continuation guard, plan 26).
- Tooling: Codebase Memory indexed as project `review` on 2026-10-30 after two orphaned daemons from earlier sessions were stopped. Caveman, TOKF, Serena and MemPalace are usable.

## Remaining verification limits

- No evidence from real users, native wheel/trackpad hardware, touch devices or assistive technology; see "Not verified" above.
- Playwright engines are automation builds. Windows/Linux modifier routing is simulated locally; physical OS shortcut delivery is untested.
- Recogito was never evaluated; no compatibility is claimed.

## History

- 2026-10-19 initial delivery: 19/19 browser-page checks in Safari 26.3.1 on macOS; real file picker, two label downloads and restore verified by hand. Recogito could not be fetched, so the native implementation was kept.
- List/code follow-up: list items and fenced code selectable as blocks; 22/22 page checks in Chromium and Safari; Playwright three-engine projects and the nine-job matrix in [.github/workflows/review.yml](../.github/workflows/review.yml) added. See [REPOSITORY.md](REPOSITORY.md).
- Core plans 01–12 closed with local evidence in the [completion audit](CORE-COMPLETION.md).
- [CI run 3](https://github.com/recircuitcoop/review/actions/runs/39318606377) passed all nine jobs on `df33471` (Windows/Linux/macOS × Chromium/Firefox/WebKit): Node tests, build and browser tests including two real label downloads and restore.
- Night theme, saved-review reopening and Cmd/Ctrl display names added; verified locally.
- 2026-10-20 [plans 17–20](plans/17-NATIVE-SCROLL-UX-PROTOTYPE.md) planned the native-scroll labeling UX after desktop swiping proved undiscoverable.
- Plan 24 instance style configuration: Safari style checks, isolated styled instances, token consumers, DOM restoration verified.
- A sandbox `listen EPERM` on port 4173 once blocked Playwright; resolved by running with an unrestricted local listener, after which the full local suite passed (51/51 at that time).
- 2026-10-29 plan 25: 26 Node tests, 63 Playwright cases; CI [run 40967319567](https://github.com/recircuitcoop/review/actions/runs/40967319567) nine/nine green.
- 2026-10-30 plan 26: current status above.
