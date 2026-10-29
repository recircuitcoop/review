# 25 — Assessment remediation

Status: in progress. Date: 2026-10-29. Branch: `fix/assessment-remediation`.

A project assessment found a spec/code conflict, unbuilt planned interaction (17/18) and widget design (23), unverified CI on the current head, an unreadable controller module, small behavior defects and stale verification records. The user directed: **keep the separate Export button**, resolve the remaining issues now, and land the result.

## Decisions

| Topic | Decision | Supersedes |
| --- | --- | --- |
| Export | The mounted widget keeps a visible **Export files** control (in the ••• action strip) and the `Mod+Shift+E` shortcut. Done still resolves pending text and runs completion. | 22/23 "no standalone Export control" |
| Plan 17 → 18 gate | The user directed implementation of 18 ahead of the 17 first-use study. Implementation proceeds; the first-use and native-device gates stay open and no discoverability claim is made. | 17 "18 begins only after this gate" |
| Trigger rule | A `wheel` event over the exact pending-highlight rectangles with `deltaX !== 0` **and** `deltaY === 0` (browser-reported pure horizontal input). `deltaX < 0` assigns the left label, `> 0` the right. Events with `ctrlKey`/`metaKey` (zoom chords) never label. No axis ratio, no thresholds, no timers, never `preventDefault()`. Mixed-axis events are ignored, so the rule fails closed: if a device never reports pure horizontal events, buttons and keyboard remain. | 07 pointer thresholds for desktop |
| Repeat safety | A successful commit clears the pending range, so later events in the same stream do nothing. Late momentum landing on a *newly* made selection cannot be distinguished by portable APIs; recorded as an open native-evidence item, not guarded by invented timing. | — |
| Pointer swipe | Removed. A pointer drag that begins on pending text performs native text selection (18 contract). `src/gesture.js`, its swipe preview and `touch-action: pan-y` go away; touch labeling remains plan 19 work. | 07 |
| Widget UI | Implement the approved 23 high fidelity: fixed-height navbar (document name ↔ action strip swap via •••, keyboard-help icon, Done), contextual whisper for pending / just-assigned / active states only, keycap help popup. Optional `document.title` names the document; it falls back to `document.id`. | 21/22 sketches |
| Outside clicks | A pointerdown outside the widget cancels an in-progress gesture but **keeps** the pending selection (spec: moving focus alone does not remove a range). Clicks on document text still replace/clear it. | — |

## Work slices

1. **Docs** — spec, plans README, 17/18/22/23 status notes reflect the decisions above.
2. **Controller refactor** — split `src/review.js` into readable modules (shortcuts/platform, dialogs/help, rendering/painting, input) with comments; no behavior change. Fixes: single platform helper (`navigator.userAgentData?.platform` with `navigator.platform` fallback); public `undo()`/`redo()` leave precise mode like the keyboard path; outside-click rule above; undo history stores frozen annotation records by reference instead of deep copies.
3. **Native horizontal labeling** — trigger rule above through the shared `classify` path; plan 17 developer probe fixture that logs wheel values over a pending range without labeling.
4. **Widget UI** — 23 production implementation with Export retained.
5. **Records** — `docs/VERIFICATION.md` rewritten as current status first, condensed history after; commit Serena's regenerated config; attempt Codebase Memory indexing with `--name review`.
6. **Land** — PR, nine-job CI matrix green on the PR head, merge.

## Acceptance

- `npm test` and `npm run check` (51+ Playwright cases, three engines) pass after every slice.
- Regression tests added for: Export control and shortcut present; host-control click keeps pending; public undo leaves precise mode; pure horizontal wheel left/right labels once; vertical, mixed-axis, zoom-chord, no-pending, saved-only and outside-hit wheel events never label; dialog open blocks wheel labeling; drag starting on pending text selects text instead of labeling; whisper states (none when idle, pending, assigned with ✓ label and Undo hint, active); ••• swap keeps navbar height; keyboard icon and F1 open the same help.
- CI: all nine jobs green on the merged head.

## Open after this plan

- 17 first-use study and native trackpad/mouse evidence; 18 native acceptance; 19/20 mobile and physical devices; 13 screen-reader and OS-reserved shortcut checks.

## Done

- [x] 1 Docs
- [x] 2 Controller refactor
- [x] 3 Native horizontal labeling
- [x] 4 Widget UI
- [x] 5 Records (Codebase Memory indexing remained blocked: `index worker could not start: active daemon coordination could not be verified safely`)
- [ ] 6 Land
