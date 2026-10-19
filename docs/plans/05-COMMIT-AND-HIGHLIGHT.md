# 05 — Commit and highlight

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 04. Covers seed acceptance: 3, 10.
Seed: [assign a label](../../selection-swipe-library.md#assign-a-label).

## Outcome

Either visible label button commits the pending range and leaves a persistent labeled highlight.

## API contract

One classification command owns commit semantics for buttons, later swipes, and keyboard actions. A valid pending range plus configured label creates one annotation with stable ID and validated anchors, emits creation and selection-change events, and clears pending state. With no pending range or active saved target, classification does nothing.

Label text remains visible; color is supplementary. Announce selection and assignment without reading the whole document. Focus stays usable. Use the state/history owner selected in 01.

## Tests and evidence

- Each label button stores the correct label, ID, positions, quote, and context; only committed text gains the label highlight.
- A second activation after pending state clears cannot duplicate the annotation.
- Invalid labels/ranges do not partially commit; unselected text stays unlabeled.
- Button focus retains the range; successful assignment exposes an accessible announcement and sensible focus.

## Done

- [x] Shared commit command and button browser checks pass.
- [x] Creation and selection-change event payloads are documented and checked.
