# 03 — Canonical text anchors

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 02. Covers seed acceptance: 2, 8, 9.
Seed: [annotation identity and anchoring](../../selection-swipe-library.md#annotation-identity-and-anchoring).

## Outcome

Translate supported DOM ranges to stable text positions and back.

## API contract

Define canonical format v1 before implementation: traversal, whitespace, block boundaries, line breaks, code whitespace, and prefix/suffix extraction. Include example input and exact expected canonical strings here. Ignore controls and temporary highlights.

Offsets use UTF-16 code units with an exclusive end. A range must be nonempty, within canonical text, and resolve to its exact quote. Store document identity/version, positions, quote, prefix, and suffix. Translate engine positions explicitly rather than assuming equivalence.

## Tests and evidence

- Table-driven exact-string tests cover every supported Markdown structure and block separators.
- Browser round-trips preserve ranges across emphasis, links, paragraphs, code, and list-item paragraphs.
- Repeated phrases select the intended occurrence; emoji, combining marks, and non-Latin text retain correct positions and quotes.
- Resize, scrolling, font changes, and highlight insertion leave canonical text and anchors unchanged; out-of-container and empty ranges fail.

## Done

- [x] Canonical rules and concrete fixtures are documented before tests/code.
- [x] DOM-to-position-to-DOM checks pass without geometry-based identity.
