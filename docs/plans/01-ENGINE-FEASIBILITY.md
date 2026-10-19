# 01 — Engine feasibility

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: none.
Seed: [recommended approach and first checkpoint](../../selection-swipe-library.md#recommended-implementation-approach).

## Outcome

A minimal browser fixture and repeatable checks establish whether the current Recogito Text Annotator can support the contract. No production feature is complete here.

## API contract

Evaluate provisional selection, programmatic block selection, overlapping ranges, gesture interception, and translation of engine positions. Provisional creation must stay out of committed exports and history. Choose one authority for committed annotations and undo/redo; document the choice here before production code. Check whether scoped read-only caret navigation can preserve native selection.

Use only enough package/test setup to run a real browser and pure logic checks. Record chosen dependencies, actual commands, and supported test engine here and in `CLAUDE.md`. Do not choose a frontend framework solely for the demo.

## Tests and evidence

- A browser smoke check loads the formatted fixture and creates a native selection.
- Engine probes show pending versus committed behavior, overlapping highlights, and a programmatic whole-block range.
- A probe preserves selection when a toolbar control takes focus and exercises a separate pointer gesture.
- Record unsupported cases and either demonstrate a narrow adapter or reject the dependency before continuing.

## Done

- [x] Engine decision and single state/history owner are documented with probe evidence.
- [x] Test commands run from a clean install; no actual annotation workflow is claimed complete.
- [x] Tooling blockers are reported; index Codebase Memory once source exists.
