# Selection and Swipe Annotation Library

## Source of truth

Read `selection-swipe-library.md` before changing behavior. It owns the product contract, initial-release scope, keyboard map, acceptance conditions, and architectural invariants. Keep this file as working guidance; update the specification in place when requirements change.

Current status: implemented local Markdown app and reusable browser library. `npm test` runs state tests; `npm run build` emits the offline app and library in `dist/`; `npm start` serves locally on port 4173; `npm run test:browser` runs Playwright. `npm run test:page` builds a self-contained browser check page for environments that cannot launch headless browsers. See `docs/VERIFICATION.md` for actual evidence and limitations.

## Documentation and development style

Use the globally installed Ponytail skill at `~/.codex/skills/ponytail/SKILL.md` for coding tasks; read it before applying it. Default to `full` mode. Source: https://github.com/DietrichGebert/ponytail. Explicit user instructions and the documented product contract take precedence.

- Work doc-first: document the behavior and public contract, encode acceptance conditions as meaningful failing tests, implement, then verify documentation, tests, and code agree. Trace current behavior and invariants before editing.
- Keep plans in `docs/plans/SCREAMING-KEBAB-CASE.md`, with concrete contracts, acceptance conditions, test coverage, and checked completion items. Create a plan when the task needs one; keep small changes small.
- Distinguish confirmed requirements, proposed UX defaults, dependency evaluations, and implementation tuning. The specification's proposed defaults still need UX validation; Recogito is an evaluation candidate, not an adopted dependency.
- Prefer explicit, readable code, relevant inline comments, early returns, and composition. Build the simplest complete system at the layer that owns the invariant. Reuse existing behavior and native platform capabilities before adding custom machinery.
- Avoid speculative features, duplicate state, unnecessary abstractions, and unrelated refactors. Prefer European and open-source tools where viable.
- Run the smallest sufficient proof, including the affected acceptance conditions. All relevant tests must pass before moving to the next implementation phase. State what was verified and any material gaps.
- Communicate tersely and concretely. Execute authorized work without repeated confirmation; raise genuine blockers and material unresolved product choices.
- Keep commits to logical units, using `type: description` (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`). Describe technical intent without AI attribution, coauthor trailers, task IDs, or test statistics.

## Product and ownership

Build a browser-only, framework-independent JavaScript library: render supplied Markdown, select contiguous passages, assign exactly one of two host-defined labels, and export committed annotations as grouped or split JSON.

The host owns document identity/version, labels, persistence, downloads, and save behavior. The library owns sanitized rendering, selection and annotation interaction, shared classification commands, completion, and structured export. Desktop mouse and keyboard are the initial target. Touch interaction requires separate validation.

Recogito was not adopted because it could not be fetched/evaluated in the development environment. The implementation uses native Range/Selection, CSS Custom Highlight, and pointer events; `ReviewSession` is the single committed-state/history owner. Marked and DOMPurify own Markdown rendering and sanitization. Reevaluate an annotation dependency only when a concrete requirement justifies it.

Do not add accounts, backend storage, collaboration, model suggestions, mutable-document reattachment, image-region annotation, discontinuous selections, or more than two labels.

## Invariants to preserve

- Selection alone never commits an annotation. One pending range may exist; a separate gesture or classification command commits it.
- A successful swipe commits exactly once. Canceled gestures and vertical scrolling never commit; canceled swipes retain the pending selection.
- Swipe, buttons, and keyboard commands share one commit path. Keep the complete initial-release shortcut map and contextual handling from the specification.
- Annotation identity depends on immutable document version and canonical rendered text, never screen geometry. Use versioned canonical-text rules, UTF-16 code-unit offsets, and exclusive end positions.
- Restore only against the matching document version and validate each range against its exact quote. Preserve stable annotation IDs and independent overlapping ranges.
- Export only committed annotations, in document order within each label. Include metadata, canonical text, offset conventions, labels, and quote/context anchors. Empty label groups remain present; unselected text stays unlabeled.
- Done resolves pending selections before completion. Save failure must leave the session available for retry.
- Sanitize rendered HTML. Preserve document read-only behavior, focus, accessibility, native selection, editable-field and IME handling, and host shortcut boundaries.
- Reflow, scrolling, resizing, and font loading cannot change text offsets. Changing the document or labels requires explicit reset or validated reload.

## First implementation checkpoint

Follow the specification's complete desktop proof of concept: formatted Markdown, block and exact range selection, separate swipe classification, two label buttons, full keyboard map and help, overlap editing, selection removal, undo/redo, Done, and JSON export. Prove gesture ambiguity and exact range round-tripping before expanding browser or touch coverage.

## Required development tools

Before substantive development, verify Caveman, Codebase Memory MCP, Serena, MemPalace, and TOKF are installed and usable for this project. Reuse installed tools and connected MCP servers; report setup failures instead of claiming readiness.

- Caveman: use installed compression/recovery tools for large outputs; `caveman tools config get` inspects configuration.
- Codebase Memory MCP: use the installed `codebase-memory` skill for structural code exploration. Check freshness and cited-path coverage before relying on graph results. Index this root with explicit project name `review` once source exists.
- Serena: initialize its instructions and activate this project by absolute path. Use symbols/references for focused code work. `.serena/project.yml` selects the TypeScript language server for future JavaScript/TypeScript source; this does not choose the implementation language.
- MemPalace: retrieve relevant project decisions and preferences; store durable, explicitly requested memory under wing `review`. Repository documentation remains authoritative.
- TOKF: use the installed hook, or `tokf run <command>` when it does not rewrite supported commands. Follow `TOKF.md` for recovery and failure handling.

@TOKF.md
