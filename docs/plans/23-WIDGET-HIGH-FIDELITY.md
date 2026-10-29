# 23 — Widget high-fidelity design

Status: **approved; production implemented** (plan 25 slice 4, 2026-10-29). See [implementation contract](../IMPLEMENTATION.md#widget-presentation).
The user approved the lo-fi flow and requested high fidelity. This refines 21/22 without changing their accepted interactions or bypassing native-input gates in 17–20.

## Locked interaction contract

- A 62px navbar swaps filename for annotation commands through •••; never expands. Keyboard, ••• and Done remain in fixed positions.
- No whisper in idle reading or after clearing/Undo. A contextual row accompanies pending text, saved editing or the approved just-assigned confirmation.
- Solid selection underline; actual configured names at opposite ends. The assigned value is explicit: `✓ Accept · Cmd+Z undo`, with matching endpoint and passage styling. Colours never replace names or the checkmark.
- The keyboard icon opens a visible popup with keycaps, effective platform mapping, close/Escape and focus return. It preserves the review target.
- Done resolves pending text and initiates the configured export/completion flow. **Export files** and `Mod+Shift+E` remain in the ••• action strip (user decision, [25](25-ASSESSMENT-REMEDIATION.md); supersedes the earlier removal). Preview does not download files.
- Changing label display examples preserves current preview annotations by stable label identity; production update compatibility remains a separate task.

## High-fidelity treatment

Source: `docs/design/widget-hifi.html`; its embedded styles match `docs/design/widget-hifi.css`. Warm light paper / quiet forest-charcoal night surfaces, subdued borders and shallow depth. Native system typography for navigation, whisper and headings; a readable system serif stack for the sample document. No external font dependency.

The first configured label has restrained teal styling; the second has warm brown styling. These are identities, not fixed semantic judgments. Pending text stays neutral with a thin solid underline; committed text has a slightly stronger category underline and subtle category fill. Explicit active editing also has an outline. The checked endpoint and centre confirmation share the passage's category styling.

The Done control has the strongest action emphasis. Other controls remain quiet, with hover/focus states, restrained keycaps and native keyboard navigation. Motion is limited to short colour changes and respects reduced motion. No decorative banners, permanent classification toolbar or new setup controls.

## Review surface

Keep all eight approved states visible together, including pending, assigned, saved editing, precise selection, after-Undo, swap and narrow/long-label examples. Add a light-appearance reference to make both palettes directly inspectable; per-view preview settings can choose System/Light/Night. The current Safari preview at `/tmp/review-flow-preview.html` must be refreshed in place so the user sees this version.

The narrow example retains the already-exposed long-label wrapping tradeoff; this does not claim validated native touch behavior. Native scroll labeling, full Range selection, export delivery and screen-reader behavior are not established by a design preview.

## Completion checks

- [x] Inspect the actual updated Safari preview, including light/night and explicit category confirmation.
- [x] Verify swap and return stay in the same row, with no document movement.
- [x] Verify the keyboard popup is on screen, closes with Escape and retains selection.
- [x] Inspect long names/narrow layout, and check the normal-text palette contrast.
- [x] User reviews high fidelity before production UI implementation.
- [x] Production navbar, action strip (with Export files), whisper and keycap help implemented with regression tests.

Use the existing preview transition assertions and syntax checks; production regression tests belong to the implementation slices after this design review.

Evidence: preview syntax and history/target assertions passed; embedded CSS matches its source file. Ten principal text/background pairs passed AA normal-text contrast (minimum 5.03:1). Safari inspection covered both appearances, the narrow wrapping tradeoff, popup/keycaps, Escape and focus return, swap/return without document movement, and explicit `✓ Reject · Cmd+Z undo` with matching passage/endpoint colour. No claim of complete accessibility or native-input acceptance follows from these preview checks.

Production evidence (2026-10-29): `npm run check` green — unit tests plus Playwright on Chromium, Firefox and WebKit. New browser checks: title with ID fallback and validation; ••• swap keeps the 62px navbar height and document position, Export files present, Mod+Shift+E exports; Escape collapses the strip before clearing; keyboard icon and F1 open identical keycap help with actual labels and return focus without clearing; whisper absent when idle/after clear/after Undo and correct for pending, precise, just-assigned (actual label and effective Undo) and active; whisper adds no canonical text. A real-input Playwright case repeats swap geometry, Escape order, Export/Mod+Shift+E and icon/F1 help. Unit tests add AA contrast for the default widget palette in both appearances and a consumer check for every public token. Screenshots of both themes (pending, assigned, strip open, help, 360px) were compared with this preview.

Known differences from the preview: production keeps the saved-annotations sidebar and bottom status line (existing features and the announcement channel); pending/committed marks use CSS Custom Highlights, so the fill covers text only rather than full line boxes and active editing has no outline; help closes with a text Close button at the end rather than an X in the heading; strip commands are not disabled when inapplicable (they do nothing instead); the pending hint reads `scroll ← → over selection`. Native-input gates (17–20) and screen-reader checks remain open.
