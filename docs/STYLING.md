# Instance styling

Set visual configuration once when mounting the library. Omitted values retain the approved high-fidelity defaults. No configuration form is rendered.

```js
import { mountReview, defaultReviewStyles } from "/dist/review-lib.js";

const review = mountReview(container, {
  document, labels,
  styles: {
    background: "#fff8ed",
    documentFontSize: "18px",
    primaryBackground: "#263f35",
    primaryTextColor: "#fffefa",
  },
});
```

The background applies to the widget and its dialogs. Internal surfaces, toolbar and code blocks have their own background tokens below. The surrounding page background belongs to the host. Each mounted instance receives an independent copy; changing the input object afterward has no effect.

`colorScheme` accepts `inherit` (default), `light` or `dark`. Inherit follows the host’s CSS `color-scheme`, including manual theme changes. Defaults use native `light-dark(...)`; choose an explicit colour to keep that token the same in either appearance. Use a current browser supporting that CSS function as well as the library’s selection/highlight requirements.

Values must be nonempty CSS strings accepted by the browser for the corresponding property. Unknown names, malformed maps and invalid values throw before replacing host content. CSS reset keywords are rejected for tokens; `colorScheme: "inherit"` is supported. CSS variables may refer to host-defined values, whose validity and availability the host owns. Styles never enter saved annotations, exports or history.

## Supported tokens and defaults

`defaultReviewStyles` is the frozen exported reference. Pass only the values you need to override. Lengths and spacing accept CSS units and shorthands where appropriate.

| Token | Default CSS value |
| --- | --- |
| `background` | `light-dark(#fffefa, #1c201f)` |
| `surfaceBackground` | `light-dark(#f1f4ef, #282f2b)` |
| `toolbarBackground` | `light-dark(#f8f9f5, #202623)` |
| `textColor` | `light-dark(#252e2b, #e9eeeb)` |
| `mutedColor` | `light-dark(#626e68, #a5b3ac)` |
| `borderColor` | `light-dark(#dce2dc, #3b4640)` |
| `focusColor` | `light-dark(#315da5, #98baff)` |
| `linkColor` | `light-dark(#226453, #a0d7bd)` |
| `codeBackground` | `light-dark(#f1f4ef, #282f2b)` |
| `buttonBackground` | `transparent` |
| `buttonTextColor` | `light-dark(#252e2b, #e9eeeb)` |
| `buttonHoverBackground` | `light-dark(#f1f4ef, #282f2b)` |
| `buttonBorderColor` | `transparent` |
| `primaryBackground` | `light-dark(#263f35, #c8dfd0)` |
| `primaryHoverBackground` | `light-dark(#263f35, #c8dfd0)` |
| `primaryTextColor` | `light-dark(#fffefa, #192c22)` |
| `leftBackground` | `light-dark(#e8f2ec, #2c4439)` |
| `leftTextColor` | `light-dark(#226453, #a0d7bd)` |
| `leftBorderColor` | `transparent` |
| `rightBackground` | `light-dark(#f9efe4, #45372c)` |
| `rightTextColor` | `light-dark(#885634, #e7ba92)` |
| `rightBorderColor` | `transparent` |
| `activeBackground` | `light-dark(#e7ece6, #35423a)` |
| `activeTextColor` | `light-dark(#252e2b, #e9eeeb)` |
| `activeBorderColor` | `light-dark(#74826f, #a5b3ac)` |
| `highlightLeftBackground` | `light-dark(#e8f2ec, #2c4439)` |
| `highlightLeftTextColor` | `light-dark(#252e2b, #e9eeeb)` |
| `highlightLeftBorderColor` | `light-dark(#226453, #a0d7bd)` |
| `highlightRightBackground` | `light-dark(#f9efe4, #45372c)` |
| `highlightRightTextColor` | `light-dark(#252e2b, #e9eeeb)` |
| `highlightRightBorderColor` | `light-dark(#885634, #e7ba92)` |
| `highlightPendingBackground` | `light-dark(#e7ece6, #35423a)` |
| `highlightPendingTextColor` | `light-dark(#252e2b, #e9eeeb)` |
| `highlightActiveBackground` | `light-dark(#e7ece6, #35423a)` |
| `highlightActiveTextColor` | `light-dark(#252e2b, #e9eeeb)` |
| `backdropColor` | `light-dark(#15271d55, #00000099)` |
| `shadowColor` | `light-dark(#1c302012, #00000033)` |
| `boxShadow` | `0 8px 28px light-dark(#1c302012, #00000033)` |
| `fontFamily` | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| `fontSize` | `14px` |
| `lineHeight` | `1.65` |
| `documentFontFamily` | `"Iowan Old Style", "Palatino Linotype", Georgia, serif` |
| `documentFontSize` | `16px` |
| `documentLineHeight` | `1.85` |
| `headingFontFamily` | `system-ui, sans-serif` |
| `headingFontSize` | `27px` |
| `headingLineHeight` | `1.3` |
| `headingLetterSpacing` | `-.025em` |
| `codeFontFamily` | `ui-monospace, SFMono-Regular, monospace` |
| `codeFontSize` | `12px` |
| `codeLineHeight` | `1.8` |
| `smallFontSize` | `12px` |
| `buttonFontSize` | `12px` |
| `borderWidth` | `1px` |
| `borderRadius` | `12px` |
| `buttonBorderWidth` | `1px` |
| `buttonRadius` | `6px` |
| `codeRadius` | `7px` |
| `dialogRadius` | `12px` |
| `focusWidth` | `3px` |
| `focusOffset` | `3px` |
| `documentPadding` | `36px 38px 26px` |
| `narrowDocumentPadding` | `28px 22px 24px` |
| `navbarHeight` | `62px` |
| `toolbarPadding` | `9px 18px` |
| `toolbarGap` | `8px` |
| `buttonPadding` | `7px 9px` |
| `paragraphSpacing` | `24px` |
| `codePadding` | `16px 18px` |
| `dialogPadding` | `22px` |
| `sidebarPadding` | `16px` |
| `statusPadding` | `12px 18px` |
| `colorScheme` | `inherit` |

The navbar, action strip, whisper and keyboard-help popup ([plan 23](plans/23-WIDGET-HIGH-FIDELITY.md)) use these tokens: `navbarHeight`, `toolbarBackground`, `toolbarPadding` and `toolbarGap` for the fixed top row; `primary*` for Done; `left*`/`right*` text colours for the label buttons and the checked whisper label; `mutedColor` and `smallFontSize` for the whisper; `surfaceBackground`, `borderColor` and `codeFontFamily` for keycaps; `shadowColor` for dialog depth. Native swipe gates remain separate work.
