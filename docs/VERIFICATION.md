# Development verification

## Current status

Date: 2026-10-29. Branch: `fix/assessment-remediation`. Command: `CI=1 npm run check`, run locally; exit code 0.

| Check | Result |
| --- | --- |
| Node tests (`npm test`: model, server, files, theme, styles) | **26/26 passed** |
| Playwright cases (`npm run test:browser`) | **57/57 passed**: 19 per engine across Chromium, Firefox and WebKit (12 core review cases, 6 host cases, 1 style case per engine) |
| Browser-check page (`npm run test:page`) | Builds `test-results/browser-check.html`; generation succeeded. It was not opened in a browser for this record. |
| Host and style checks | Run inside the Playwright suite above (`host.spec.js`, `styles.spec.js`); the reporter prints case counts, not in-page check counts. |

Environment: macOS (Darwin 25.3.0), Node v22.18.0, Playwright 1.58.2 with Chromium 143.0.7499.4, Firefox 146.0.1 and WebKit 26.0 (Playwright's engine builds, not Safari itself).

Changed in plan 25 ([25](plans/25-ASSESSMENT-REMEDIATION.md)): Export kept as a user-facing action alongside Done; native horizontal-scroll labeling over the pending highlight replaced the pointer swipe; hi-fi navbar, contextual whisper and keycap help are in production; the controller was split; assessment defects were fixed.

- CI matrix on this head: **pending** (to be filled after the PR run).
- Not verified: first-use study (plan 17); native trackpad/mouse wheel delivery and momentum (18); mobile and physical devices (19/20); screen-reader announcements and OS-reserved shortcuts (13).
- Known limitation: late wheel momentum can label a newly made selection (plan 18).
- Tooling: Codebase Memory indexing is blocked (`index worker could not start: active daemon coordination could not be verified safely`; daemons from other sessions are running). Caveman, TOKF, Serena and MemPalace are usable.

## Remaining verification limits

- CI matrix (Windows/Linux/macOS × three engines) has not run on this head.
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
- 2026-10-29 plan 25: current status above.
