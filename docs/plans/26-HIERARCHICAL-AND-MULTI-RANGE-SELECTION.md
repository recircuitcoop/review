# 26 — Hierarchical and multi-range selection

Status: implemented; native back-swipe suppression remains a manual check (see below). Date: 2026-10-30. Branch: `feat/hierarchical-multi-selection`.

Manual testing of the plan 25 build on macOS with a real mouse rejected three behaviours. These user requirements override the conflicting parts of the specification, plan 25 and `CLAUDE.md`, which are updated in place.

1. A right swipe over the pending selection labeled it, but a left swipe navigated the browser back a page. The plan 25 wheel listener was passive and never canceled, so the browser's history-swipe gesture won.
2. Clicking a heading must select the whole content under it; clicking an item in a bullet hierarchy must select everything nested under it. A click-and-drag is the only exception.
3. Shift+click and Shift+drag append to the selection, and one swipe then labels the whole selection.

## Decisions

| Topic | Decision | Supersedes |
| --- | --- | --- |
| Wheel cancellation | The wheel listener is non-passive. It calls `preventDefault()` on exactly the events that qualify under the plan 25 trigger rule (pending selection, no open dialog, no Ctrl/Meta, `deltaX !== 0 && deltaY === 0`, pointer inside a pending range's client rectangles). | 25 "never `preventDefault()`" |
| Continuation | After a qualifying event, pure horizontal, non-Ctrl/Meta events arriving within **200 ms** of the last canceled event are the rest of that gesture: canceled, never committed. Each one extends the window. 200 ms is an implementation tuning constant (`CONTINUATION_GAP_MS` in `src/pointer.js`): longer than the gap between wheel events in one swipe or momentum stream (typically one frame, ≈16 ms), shorter than a deliberate new select-then-swipe. | 25 repeat safety: fixes the known limitation that late momentum labeled a newly made selection |
| Never canceled | Vertical, mixed-axis and Ctrl/Meta (zoom) input; horizontal input that neither qualifies nor continues a labeling gesture. Native scrolling, zoom and navigation stay untouched outside a labeling gesture. | — |
| Heading click | `hN` selects from the heading start through the end of the last block before the next heading of level ≤ N in document order, or the document end. | Spec "Click a heading selects its text" |
| List item click | The whole `li`, including all nested lists. A nested item selects only its own subtree. A paragraph inside a loose-list item selects that item. A code block inside an item keeps selecting the code block. A trailing block separator inside the item is not part of the range. | — |
| Other blocks | Paragraphs, blockquote paragraphs and code blocks keep their block behaviour. | — |
| Keyboard Enter | Enter on a focused block uses the same scope as a click (one shared `selectBlock`), so a focused heading selects its section. | — |
| Drag | Click-and-drag keeps the exact native range, unchanged. | — |
| Shift appends | Shift+click (with the hierarchy rule) and Shift+drag (exact range) add to the pending set. Plain click/drag replaces it. Overlapping or touching ranges merge into one contiguous range. | CLAUDE.md "One pending range may exist" |
| Commit together | A swipe over any pending range, the label buttons, keyboard label commands and Done each commit every pending range with the same label: one annotation per contiguous range, as one undo step. Escape and Delete clear the whole set. | — |
| Contiguity | Annotations stay contiguous; export format and restore are unchanged. Shift only builds several pending ranges that commit together. | CLAUDE.md "Do not add … discontinuous selections" (narrowed) |
| Native Shift+click | On a Shift press the native selection is collapsed at the press point, so the browser's default Shift+click extension cannot produce one spanning range from an older anchor. Pending ranges are painted only with the CSS Custom Highlight; native Selection holds at most the range being dragged and is cleared when it is appended. | — |
| Shift on saved highlights | Shift+click ignores saved-highlight precedence and appends the clicked block's scope. If a saved annotation is active, appending ends that edit and starts a new pending set. | — |
| Whisper and events | The whisper anchors to the most recently added (or merged) pending range. `review:selection` details keep their existing shape and describe that range. | — |

## Contracts

- `ReviewSession` (`src/model.js`) remains the only committed-state/history owner. `select(start, end)` replaces the pending set; new `add(start, end)` merges a range into it; `pending` is the most recent range (unchanged shape, `null` when empty); new `pendingRanges` lists the set in document order. `classify(labelId)` with pending ranges creates one annotation per range in a single history entry and returns the annotation made from the most recent range.
- `src/render.js` `blockScope(surface, text, block)` returns the canonical `{ start, end }` a click or Enter selects. Offsets come from the existing canonical-text map; no geometry.
- `src/pointer.js` owns the Shift press, the hierarchical click and the wheel cancellation; `src/review.js` keeps the single `classify` path.

## Acceptance

Real mouse/keyboard Playwright cases (`tests/review.spec.js`, on `tests/fixtures/sections.md` via `/tests/fixture.html?doc=sections`; `review.md` stays unchanged because the downloaded `tests/artifacts` label files are bound to its canonical text), all three engines:

- A heading click selects its whole section; a lower-level heading selects only its subsection.
- A parent list item click selects its nested subtree; a nested item selects only its subtree.
- A drag inside a heading keeps its exact range.
- Shift+click appends a second range; Shift+drag appends an exact range; overlapping ranges merge.
- One horizontal swipe over one pending range labels every range; one Undo removes them all and Redo restores them all. Escape clears every pending range.
- Qualifying left and right wheel input is `defaultPrevented`; vertical, Ctrl (zoom), no-pending and outside-range input is not.
- A continuation event over a newly selected range is canceled and does not commit; after the gap, a new qualifying event labels.

Unit tests (`tests/model.test.js`): batch commit creates one annotation per range in one undo step; `add` merges overlapping and touching ranges; `select` replaces the set; clear and invalid adds leave state intact.

Browser-check page (`tests/browser-check.js`): wheel checks updated to the cancellation contract; the plan 18 known-limitation check now asserts the continuation guard.

## Manual checks (not provable in Playwright)

- macOS Chrome, Safari and Firefox with Magic Mouse and trackpad: a left swipe over a pending range labels it and the page does not navigate back; a right swipe does not navigate forward; the same swipe outside the selection still navigates.

## Observations (not changed here)

- Canonical format v1 inserts no separator between a list item's own text and its nested list, so a parent item's quote reads `Parent itemChild item…`. Changing it needs a new canonical-format version and would invalidate saved reviews; out of scope.
- When the whisper moves to a newly selected block below the previous target, the previous block's reserved room is released and the new block shifts up under the pointer (pre-existing plan 23 placement; Shift+click makes it more frequent). Users re-hover before swiping; the tests do the same.

## Done

- [x] 1 Docs: spec, CLAUDE.md invariants, plans README, this plan
- [x] 2 Failing tests
- [x] 3 Wheel cancellation and continuation
- [x] 4 Hierarchical click scope
- [x] 5 Shift-append pending set and batch commit
- [x] 6 Gates: `CI=1 npm run check`, `npm run build`, records
