# 04 — Pending selection

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 03. Covers seed acceptance: 1, 3, 12.
Seed: [select a portion](../../selection-swipe-library.md#select-a-portion).

## Outcome

Click or drag to establish one visible pending range, without creating an annotation.

## API contract

Select/clear operations use the canonical range model. Resolve click versus drag on pointer release: a paragraph/heading click selects its text; a drag retains the exact native range across supported blocks. Other supported text is range-selectable. Ignore empty selections and controls; reject ranges outside the container.

Escape clears pending state. Toolbar focus preserves it. A pointer gesture starting without pending state cannot classify the range it establishes. Validate the proposed new-selection replacement and link-click defaults and record the result in the seed before finalizing behavior.

## Tests and evidence

- Browser clicks select paragraph/heading text; a drag across inline markup or blocks never expands to a whole block.
- Establishing, replacing, and clearing ranges produces selection-change events but zero committed annotations/history entries.
- Outside clicks clear pending state; a new eligible block click selects that block. Control focus does not clear it.
- Empty ranges, outside text, Escape, and code-range selection follow the contract; ordinary selection clicks do not unexpectedly navigate links.

## Done

- [x] Pending transitions and browser selection checks pass.
- [x] Proposed interaction defaults have recorded validation evidence.
