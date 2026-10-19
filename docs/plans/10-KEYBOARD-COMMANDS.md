# 10 — Keyboard commands

Status: complete for core/local acceptance; see [completion evidence](../CORE-COMPLETION.md). Native release coverage belongs to plan 13. Depends on: 06, 07, 08. Covers seed acceptance: 10–14 (precise selection continues in 11; completion in 12).
Seed: [complete shortcut table](../../selection-swipe-library.md#capabilities-and-keyboard-shortcuts--initial-release).

## Outcome

Route scoped keyboard commands through existing operations, with a toolbar, remapping, and accurate help.

## API contract

Use the seed's table as the exact default mapping. Implement block focus/Enter, labeling, clear/deselect/delete, saved navigation, chooser, history, export, and help. Register F2 and Done through the same dispatcher when their handlers land in 11/12. Tab never traps focus; saved navigation orders by range then ID and scrolls into view.

Scope shortcuts to annotator focus. Preserve editable fields, host controls, IME, and native word selection. Prevent defaults only for applicable commands, except scoped no-target Delete/Backspace must prevent document mutation/history navigation. Menus/dialogs take precedence; Escape closes the top surface or cancels a swipe before clearing the underlying range. Remapping updates controls and help from one effective map; document override/conflict validation.

## Tests and evidence

- Table-driven dispatcher tests exercise every handler available in this slice and applicable/inapplicable contexts.
- Browser checks cover normal Tab order, block Enter versus button Enter, saved ordering/scrolling, chooser navigation, and selection retention on toolbar focus.
- Windows/Linux and macOS mapping variants handle Mod, undo/redo, and export correctly; editable fields, IME, and host controls retain their behavior.
- Remapping changes both execution and hints/help; F1 opens help, Escape closes it first, and no-target deletion is harmless.

## Done

- [x] Available commands and visible/toolbar equivalents pass focused tests.
- [x] F2/Done handlers from 11/12 complete the locally tested map; native cross-platform release verification remains in 13.
