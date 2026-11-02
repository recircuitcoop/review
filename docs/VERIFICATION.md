# Development verification

## Current status

Date: 2026-11-02. First release **`v0.1.0`** tagged on `main` at `71a52be` (PR #5 merge). Command: `npm test` and `npx playwright test` run locally; exit code 0. A developer `npm start` held port 4173, so the Playwright stage ran through a scratch config that only moved the server to a free port.

| Check | Result |
| --- | --- |
| Node tests (`npm test`: model, server, files, theme, styles) | **29/29 passed** |
| Playwright cases (`npm run test:browser`) | **144/144 passed**: 48 per engine across Chromium, Firefox and WebKit, including the accessibility gates below, real-mouse heading/list hierarchy clicks, Shift+click/Shift+drag append, one-swipe batch labeling with a single undo, wheel cancellation (`defaultPrevented`) cases, block geometry unchanged by click/Shift+click/label/undo, click-then-swipe with the pointer unmoved, and swipes in place after clicks away from the text (right edge, short last line, code padding, gaps inside a section, bullet markers, a nested item's top boundary), and wheel handling under 16 ms per event on a 2000-block document. |
| Browser-check page (inside `host.spec.js`) | **41/41** in each engine, with the wheel checks updated to the cancellation contract |
| Browser-check page (`npm run test:page`) | Builds `test-results/browser-check.html`; generation succeeded. It was not opened in a browser for this record. |
| Host and style checks | Run inside the Playwright suite above (`host.spec.js`, `styles.spec.js`); the reporter prints case counts, not in-page check counts. |

Environment: macOS (Darwin 25.3.0), Node v22.18.0, Playwright 1.58.2 with Chromium 143.0.7499.4, Firefox 146.0.1 and WebKit 26.0 (Playwright's engine builds, not Safari itself).

Changed in plan 26 ([26](plans/26-HIERARCHICAL-AND-MULTI-RANGE-SELECTION.md)): qualifying horizontal wheel input over pending text and its 200 ms continuation are canceled (fixes the left swipe navigating back); a heading click selects its section and a list item its nested hierarchy; Shift+click/drag appends pending ranges that one label commits together as one undo step. After verifier review the whisper became layout-neutral (an overlay that never moves text; paragraphs and code blocks have 32px bottom spacing to hold it), heading sections end at the last content before the next heading, and a pending range's swipe hit area (recorded at selection time, read from live geometry) covers whole selected blocks including list bullets and the gaps inside a selected section.

Changed in plan 25 ([25](plans/25-ASSESSMENT-REMEDIATION.md)): Export kept as a user-facing action alongside Done; native horizontal-scroll labeling over the pending highlight replaced the pointer swipe; hi-fi navbar, contextual whisper and keycap help are in production; the controller was split; assessment defects were fixed.

- CI matrix: [run 40967319567](https://github.com/recircuitcoop/review/actions/runs/40967319567) on `647162e` **passed all nine jobs** (Windows/Linux/macOS × Chromium/Firefox/WebKit). Independent verification found and then confirmed the fix for a whisper caret-navigation defect in precise mode.
- CI matrix for plan 26: [run 41056037628](https://github.com/recircuitcoop/review/actions/runs/41056037628) on `97dfd85` **passed all nine jobs**; a fourth independent verification confirmed that head.
- CI matrix for the accessibility gates and `v0.1.0`: [run 41429930031](https://github.com/recircuitcoop/review/actions/runs/41429930031) on `e7adf74` **passed all nine jobs**; two independent verifications preceded it.
- Hand test (2026-11-02): the user tested the plan 26 build on macOS with a real mouse and reported all behaviours working, including left-swipe labeling without back navigation. Browsers and devices were not itemized.
- Not verified: per-browser and trackpad coverage of back/forward history-swipe suppression beyond that hand test (Playwright can only prove `defaultPrevented`); native trackpad/mouse wheel delivery and momentum (18); mobile and physical devices (19/20); screen-reader announcements and OS-reserved shortcuts (13).
- Closed: late wheel momentum no longer labels a newly made selection (continuation guard, plan 26).
- Accessibility gates (2026-11-02, plans 16/21/22; branch `test/a11y-gates`; `npm test` 29/29, Playwright 144/144 across Chromium/Firefox/WebKit on a free port serving this checkout): rendered light and dark colors of document, code, navbar, strip, label buttons, Done, whisper, status line, sidebar, help dialog, keycaps, all four highlights and the focus ring meet 4.5:1 / 3:1 in real engines, and the Node token test now also covers code text, navbar/dialog buttons, primary hover, focus ring, highlight underlines and the pressed saved-item border; real-key Escape priority (help → strip → clear) with focus return; keyboard-only labeling through the strip; focus return after the overlap chooser and the Done resolution dialog (chosen and canceled); keyboard theme toggle keeps its focus, pending selection, saved annotations and undo; a remapped Undo shows in the whisper, title, `aria-keyshortcuts` and help and works; the polite status line is the widget's only live region, hover/pointer movement and ••• open/close announce nothing, and label, undo and clear each announce once. These gates found that ••• re-announced the pending selection; it now repaints only the whisper. They also found that in WebKit a mouse-clicked navbar button did not take focus, so Escape and shortcuts stopped reaching the widget; clicked navbar buttons now take focus. Dark contrast is read with reduced motion so button color transitions cannot be sampled mid-change.
- Tooling: Codebase Memory indexed as project `review` on 2026-10-30 after two orphaned daemons from earlier sessions were stopped. Caveman, TOKF, Serena and MemPalace are usable.

### Manual: screen reader

Not yet run. The automated gates above prove DOM state, focus and live-region mutations, not what VoiceOver actually speaks. Run on macOS with VoiceOver (Cmd+F5) and Safari; record date, macOS, Safari and VoiceOver versions and pass/fail per step here. Expected wording comes from `src/review.js`, `src/dialogs.js` and `src/theme.js`; VoiceOver adds its own role and state words.

1. Open `dist/review.html`, choose `tests/fixtures/review.md`, keep labels Accept / Reject, press Start review. Expected: VoiceOver does not read the annotator status line until something changes.
2. Move VoiceOver to the theme button and press VO+Space twice. Expected: "Night theme, toggle button" with its state flipping each time (selected / not selected); focus stays on the button; the annotator says nothing.
3. Tab to the document ("Read-only document"), press Option+Down twice, then Enter. Expected once: "Selected N characters: Keep this important sentence…". The whisper below the paragraph is never read as an announcement.
4. Press Option+Left. Expected once: "Accept assigned. 1 saved annotations." Then Cmd+Z. Expected once: "Undone."
5. Press Enter on the block again, then Escape. Expected: "Selected …", then once "Selection cleared."
6. Select the block again, Tab to "Annotation actions, collapsed, button", press VO+Space. Expected: "expanded"; the selection is not re-announced. Press Escape. Expected: "collapsed"; focus stays on Annotation actions; the selection remains (Option+Left still labels it).
7. Press F1. Expected: "Keyboard shortcuts, dialog" with focus on "Close, button"; rows read label then keys (for example "Undo, Cmd+Z"). Press Escape. Expected: focus returns to the control that opened it; nothing else is announced.
8. With a pending selection press Cmd+Enter. Expected: "Resolve pending selection, dialog" with Accept, Reject, Discard pending selection and Cancel. Escape returns focus to the document block and keeps the selection; choosing Accept instead announces "Review complete. Annotations remain available for export or retry." and returns focus.
9. With VoiceOver's mouse-pointer speech off, move the mouse across the document and navbar. Expected: no announcement from the status line.

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
