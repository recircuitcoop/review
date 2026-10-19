# 08 — JSON export

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 06. Covers seed acceptance: 2, 5, 7, 13.
Seed: [export](../../selection-swipe-library.md#export).

## Outcome

Serialize committed annotations as grouped JSON or one self-contained payload per label.

## API contract

Document the exact JSON schema and representative payload here before implementation. Include document ID/version, canonical text and format version, UTF-16/exclusive-end conventions, labels, and annotation IDs/positions/quotes/context. Group by stable label ID and preserve document order; use annotation ID for deterministic equal-range ordering.

Split export includes both labels, even empty ones, with sufficient metadata/text in each payload. Export is read-only: pending selection stays selected and excluded; unselected text gets no inferred label. File saving belongs to the host.

Host delivery/naming has an open follow-up: [plan 14](14-SPLIT-EXPORT-DELIVERY.md). Passing serializer tests do not prove both label files were downloaded.

## Tests and evidence

- Exact-payload tests cover zero annotations, one empty label, arbitrary display names, and both formats.
- Relabel/delete/undo/redo immediately changes exports to match committed state, including independent overlaps.
- Each exported quote equals the canonical slice at its positions; pending text is absent without clearing pending state.
- Mutating a returned payload cannot alter the live annotation state.

## Done

- [x] Documented schema and grouped/split fixtures match passing serializer tests.
- [x] Browser export control returns structured data without requiring filesystem access.
