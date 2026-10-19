# 02 — Safe document rendering

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 01.
Seed: [input and rendering](../../selection-swipe-library.md#input-and-rendering).

## Outcome

Mount a valid host-supplied document as sanitized HTML with visible labels and a Done control.

## API contract

Mount accepts a container, document ID, immutable version/hash, Markdown, and exactly two labels with distinct stable IDs, display names, and unique left/right assignments. Validate input before inserting document UI. Optional colors supplement visible text and accessible names.

Support headings, paragraphs, emphasis, links, lists, blockquotes, and fenced code. Sanitize before DOM insertion; interface controls are outside document text. Do not advertise tables or custom HTML extensions. Done is present but its completion behavior belongs to 12.

## Tests and evidence

- Browser fixture renders every supported block and inline feature as selectable HTML, with named controls.
- Malicious Markdown/HTML, event attributes, and unsafe link URLs cannot execute or create unsafe DOM.
- Missing document identity/version and invalid label counts, IDs, or direction assignments fail with useful errors before mounting.
- Two mounted fixtures keep document text and controls isolated.

## Done

- [x] Input and sanitization checks pass, including negative cases.
- [x] Supported Markdown profile and mount/error behavior are documented.
