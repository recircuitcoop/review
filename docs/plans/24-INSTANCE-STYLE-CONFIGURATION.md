# 24 — Instance style configuration

Status: implemented and verified locally.

## Contract

`mountReview(container, { ...options, styles })` accepts a partial map of named style tokens. Omitted values use the approved high-fidelity defaults. `background` is first-class and defaults to the current warm paper / forest-charcoal surface. Values are CSS strings, including lengths, font stacks and `light-dark(...)` colours. `colorScheme` can inherit the host's appearance or select light/dark per instance.

Export the frozen `defaultReviewStyles` map from the library so hosts can inspect all supported names and defaults. Resolve a fresh map at mount; never mutate host options or shared defaults. Apply variables to the new `.review` root, not `:root`, body or another instance. Do not put style data in annotations, history, export or saved-review identity.

Examples:

```js
mountReview(container, {
  document, labels,
  styles: {
    background: '#fff8ed',
    colorScheme: 'light',
    fontFamily: 'system-ui, sans-serif',
    documentFontFamily: 'Georgia, serif',
    documentFontSize: '18px',
    documentPadding: '32px',
    borderRadius: '10px',
    buttonBackground: '#f0eee8',
    buttonTextColor: '#24392d',
    primaryBackground: '#24392d',
    primaryTextColor: '#ffffff',
  },
});
```

Supported families: background/surfaces; text/muted/link/focus; neutral and primary button colours; both labels and all highlight states; UI/document/heading/code typography; global and control borders/radii; document/toolbar/dialog spacing; component shadow. The default map is the exact list, not an unrestricted CSS injection API.

Reject non-map inputs, unknown tokens, non-string/empty values and invalid CSS values before replacing host content. A rejected mount must leave the existing host DOM untouched. Custom property values cannot use CSS-wide reset keywords; `colorScheme: 'inherit'` is an explicit supported native property.

## Scope

This installs the high-fidelity **style defaults and configuration API** in the library. It does not silently implement native scrolling, the new widget interaction/layout or pending-label metadata updates; their existing gates remain open. The approved design preview remains the UX reference. The host still owns its own page background; this configuration styles the mounted widget and its internal surfaces.

## Small checks

- [x] Document and export named defaults; no setup form inside widget.
- [x] Unit tests for defaults, partial override, isolation/copying and malformed maps.
- [x] Browser proof: two simultaneous differently styled instances; background, buttons, fonts, spacing and borders actually computed from configuration.
- [x] Browser proof: invalid CSS/unknown configuration does not replace host DOM.
- [x] Browser proof: highlights/dialogs inherit the correct instance, host styles remain untouched, destroy restores original content.
- [x] Existing tests/build and relevant native check pages pass; record limitations honestly.

## Verification

All 24 Node tests pass. Native Safari: 4/4 style checks, 31/31 core browser checks and 9/9 host checks. Build emits the library, CSS and offline app. [Styling reference](../STYLING.md) lists every supported token and exact default. No native Windows/Linux or additional browser-engine run was performed for this change; gesture/production widget design gates remain separate.
