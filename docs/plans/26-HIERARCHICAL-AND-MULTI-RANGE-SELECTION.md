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

## Verifier correction (layout-neutral whisper, section end)

An independent verifier refuted the first head (`cd9ccba`):

1. **Text moved under the pointer.** The whisper reserved room by growing its block's bottom margin. Clicking block B below block A moved that margin from A to B, so B shifted up about 40px in all three engines. The unmoved pointer then sat in a gap, and a swipe was neither labeled nor canceled. On real hardware, that brings back the back-navigation bug. Decision: the whisper is layout-neutral. It is an absolute overlay centred in the existing spacing below its block and never changes any block's margin or size. Spacing changes only where the whisper needs room. Paragraphs, the usual anchor, keep `margin: 0 0 var(--review-paragraph-spacing)`, and the default rises from 24px to 32px. The whisper's minimum height is 24px, so 24px spacing left it flush against both lines and failed the existing "between the passage and the next block" check. Code blocks gain the same bottom spacing, because their native 16px cannot hold the whisper. Headings, lists, list items and blockquotes keep native spacing; tight lists stay tight. A whisper under one of them overlays the next line: it is opaque (paper background `--review-panel`), inert (`pointer-events: none`), and the swipe hit test is geometric, so nothing underneath is lost to input. The same applies to a narrow-width wrap or a host's smaller `paragraphSpacing`. New invariant: selection, append, label, undo/redo and whisper changes never move document text.
2. **Section end off by one.** The end was computed as "next heading start − 1", which assumed a separator always precedes the next heading. For `## A\n\n- item\n  ## B` that gave `A\nite`. The end is now the end of the last rendered content before the next heading element: a Range ending before that element, mapped through the canonical text's new `contentEnd(position)`, which skips block separators by segment kind instead of guessing. List items use the same helper.

Tests: block geometry (relative to the surface, rounded to 0.01px against Firefox's sub-pixel float noise) is identical after a plain click, a plain click below, Shift+click below and above, a label and an undo. A click followed by a swipe with the pointer unmoved labels and cancels in both directions, including a Shift selection built top to bottom. The `## A … ## B` case selects `A\nitem`. The re-hover workarounds are removed. All three new tests fail against the `cd9ccba` whisper and scope code and pass now. The precise-mode Shift+ArrowDown and drag-across-whisper baselines still match.

3. **Click away from the text, then swipe in place, did nothing** (second re-verification, `e9b405c`). A click anywhere in a block selects it, but the swipe hit test accepted only the range's text line boxes. Clicking right of the text, in a code block's padding, or after a short last line and then swiping in place was neither labeled nor canceled, in all three engines. Decision: a pending range's hit area is its text line rectangles (still the only area for exact drags that cover blocks partially), plus the border box of every selectable block it fully covers, plus, for several covered blocks, the band from the first one's top to the last one's bottom across the document column. It is read at event time; the rest of the trigger rule is unchanged. Tests: a click at a paragraph's right edge, after a wrapping paragraph's short last line and in a code block's left padding, each followed by a swipe in place, labels and cancels. A selected section labels from the gap between its blocks and is not canceled in the gap after its last block or beyond the column. All three tests fail against `e9b405c` in every engine.

4. **Bullets missed and the wheel path was too slow** (third re-verification, `7d6c2c6`). Clicking a list item's bullet (outside its box) selected it, but a swipe in place missed, in all three engines; a click on a nested item's top boundary missed by a fraction of a pixel. Each miss also mapped every block through canonical offsets: about 0.4–1.1 s per event at 256 blocks, 7.7 s at 504, and no result at 2000. Decision: hit areas are recorded when a pending piece is made, never computed at wheel time. Each piece keeps its DOM range and, for a click/Enter scope, the elements `blockScope` covered. The wheel reads only their live rects: a list item reaches left to its list's edge, a section keeps its band, and every edge has 1px tolerance. Per-event work is bounded by the pending pieces' own elements. Tests: a bullet click then an in-place swipe labels and cancels for a leaf item, a nested item and a Shift multi-range, and so does a boundary click. On a 2000-block document, 20 misses and one hit each take under 16 ms (`performance.now()` around dispatch). All of these fail against `7d6c2c6`.

Remaining observation, not changed: canonical format v1 inserts no separator between a list item's own text and its nested list, so a parent item's quote reads `Parent itemChild item…`. Changing it needs a new canonical-format version.

## Done

- [x] 1 Docs: spec, CLAUDE.md invariants, plans README, this plan
- [x] 2 Failing tests
- [x] 3 Wheel cancellation and continuation
- [x] 4 Hierarchical click scope
- [x] 5 Shift-append pending set and batch commit
- [x] 6 Gates: `CI=1 npm run check`, `npm run build`, records
