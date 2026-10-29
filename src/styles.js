// One default and one native CSS validation rule for each public style token.
const tokens = {
  background: ['--review-panel', 'background-color', 'light-dark(#fffefa, #1c201f)'],
  surfaceBackground: ['--review-subtle', 'background-color', 'light-dark(#f1f4ef, #282f2b)'],
  toolbarBackground: ['--review-toolbar-bg', 'background-color', 'light-dark(#f8f9f5, #202623)'],
  textColor: ['--review-text', 'color', 'light-dark(#252e2b, #e9eeeb)'],
  mutedColor: ['--review-muted', 'color', 'light-dark(#626e68, #a5b3ac)'],
  borderColor: ['--review-border', 'border-color', 'light-dark(#dce2dc, #3b4640)'],
  focusColor: ['--review-focus', 'color', 'light-dark(#315da5, #98baff)'],
  linkColor: ['--review-link', 'color', 'light-dark(#226453, #a0d7bd)'],
  codeBackground: ['--review-code', 'background-color', 'light-dark(#f1f4ef, #282f2b)'],
  buttonBackground: ['--review-button-bg', 'background-color', 'transparent'],
  buttonTextColor: ['--review-button-text', 'color', 'light-dark(#252e2b, #e9eeeb)'],
  buttonHoverBackground: ['--review-button-hover', 'background-color', 'light-dark(#f1f4ef, #282f2b)'],
  buttonBorderColor: ['--review-button-border', 'border-color', 'transparent'],
  primaryBackground: ['--review-primary', 'background-color', 'light-dark(#263f35, #c8dfd0)'],
  primaryHoverBackground: ['--review-primary-hover', 'background-color', 'light-dark(#263f35, #c8dfd0)'],
  primaryTextColor: ['--review-on-primary', 'color', 'light-dark(#fffefa, #192c22)'],
  leftBackground: ['--review-left-bg', 'background-color', 'light-dark(#e8f2ec, #2c4439)'],
  leftTextColor: ['--review-left-text', 'color', 'light-dark(#226453, #a0d7bd)'],
  leftBorderColor: ['--review-left-border', 'border-color', 'transparent'],
  rightBackground: ['--review-right-bg', 'background-color', 'light-dark(#f9efe4, #45372c)'],
  rightTextColor: ['--review-right-text', 'color', 'light-dark(#885634, #e7ba92)'],
  rightBorderColor: ['--review-right-border', 'border-color', 'transparent'],
  activeBackground: ['--review-active-bg', 'background-color', 'light-dark(#e7ece6, #35423a)'],
  activeTextColor: ['--review-active-text', 'color', 'light-dark(#252e2b, #e9eeeb)'],
  activeBorderColor: ['--review-active-border', 'border-color', 'light-dark(#74826f, #a5b3ac)'],
  highlightLeftBackground: ['--review-mark-left-bg', 'background-color', 'light-dark(#e8f2ec, #2c4439)'],
  highlightLeftTextColor: ['--review-mark-left-text', 'color', 'light-dark(#252e2b, #e9eeeb)'],
  highlightLeftBorderColor: ['--review-mark-left-border', 'color', 'light-dark(#226453, #a0d7bd)'],
  highlightRightBackground: ['--review-mark-right-bg', 'background-color', 'light-dark(#f9efe4, #45372c)'],
  highlightRightTextColor: ['--review-mark-right-text', 'color', 'light-dark(#252e2b, #e9eeeb)'],
  highlightRightBorderColor: ['--review-mark-right-border', 'color', 'light-dark(#885634, #e7ba92)'],
  highlightPendingBackground: ['--review-mark-pending-bg', 'background-color', 'light-dark(#e7ece6, #35423a)'],
  highlightPendingTextColor: ['--review-mark-pending-text', 'color', 'light-dark(#252e2b, #e9eeeb)'],
  highlightActiveBackground: ['--review-mark-active-bg', 'background-color', 'light-dark(#e7ece6, #35423a)'],
  highlightActiveTextColor: ['--review-mark-active-text', 'color', 'light-dark(#252e2b, #e9eeeb)'],
  backdropColor: ['--review-backdrop', 'color', 'light-dark(#15271d55, #00000099)'],
  shadowColor: ['--review-shadow', 'color', 'light-dark(#1c302012, #00000033)'],
  boxShadow: ['--review-box-shadow', 'box-shadow', '0 8px 28px light-dark(#1c302012, #00000033)'],
  fontFamily: ['--review-font-family', 'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'],
  fontSize: ['--review-font-size', 'font-size', '14px'],
  lineHeight: ['--review-line-height', 'line-height', '1.65'],
  documentFontFamily: ['--review-document-font', 'font-family', '"Iowan Old Style", "Palatino Linotype", Georgia, serif'],
  documentFontSize: ['--review-document-size', 'font-size', '16px'],
  documentLineHeight: ['--review-document-line-height', 'line-height', '1.85'],
  headingFontFamily: ['--review-heading-font', 'font-family', 'system-ui, sans-serif'],
  headingFontSize: ['--review-heading-size', 'font-size', '27px'],
  headingLineHeight: ['--review-heading-line-height', 'line-height', '1.3'],
  headingLetterSpacing: ['--review-heading-spacing', 'letter-spacing', '-.025em'],
  codeFontFamily: ['--review-code-font', 'font-family', 'ui-monospace, SFMono-Regular, monospace'],
  codeFontSize: ['--review-code-size', 'font-size', '12px'],
  codeLineHeight: ['--review-code-line-height', 'line-height', '1.8'],
  smallFontSize: ['--review-small-size', 'font-size', '12px'],
  buttonFontSize: ['--review-button-size', 'font-size', '12px'],
  borderWidth: ['--review-border-width', 'border-top-width', '1px'],
  borderRadius: ['--review-radius', 'border-radius', '12px'],
  buttonBorderWidth: ['--review-button-border-width', 'border-top-width', '1px'],
  buttonRadius: ['--review-button-radius', 'border-radius', '6px'],
  codeRadius: ['--review-code-radius', 'border-radius', '7px'],
  dialogRadius: ['--review-dialog-radius', 'border-radius', '12px'],
  focusWidth: ['--review-focus-width', 'outline-width', '3px'],
  focusOffset: ['--review-focus-offset', 'outline-offset', '3px'],
  documentPadding: ['--review-document-padding', 'padding', '36px 38px 26px'],
  narrowDocumentPadding: ['--review-narrow-document-padding', 'padding', '28px 22px 24px'],
  navbarHeight: ['--review-navbar-height', 'height', '62px'],
  toolbarPadding: ['--review-toolbar-padding', 'padding', '9px 18px'],
  toolbarGap: ['--review-toolbar-gap', 'gap', '8px'],
  buttonPadding: ['--review-button-padding', 'padding', '7px 9px'],
  paragraphSpacing: ['--review-paragraph-spacing', 'margin-bottom', '24px'],
  codePadding: ['--review-code-padding', 'padding', '16px 18px'],
  dialogPadding: ['--review-dialog-padding', 'padding', '22px'],
  sidebarPadding: ['--review-sidebar-padding', 'padding', '16px'],
  statusPadding: ['--review-status-padding', 'padding', '12px 18px'],
  colorScheme: ['color-scheme', 'color-scheme', 'inherit'],
};

export const defaultReviewStyles = Object.freeze(Object.fromEntries(Object.entries(tokens).map(([name, [, , value]]) => [name, value])));

export function resolveReviewStyles(overrides = {}) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides) || ![Object.prototype, null].includes(Object.getPrototypeOf(overrides))) throw new Error('Styles must be a map of named CSS values.');
  for (const [name, value] of Object.entries(overrides)) {
    if (!Object.hasOwn(tokens, name)) throw new Error(`Unknown style: ${name}`);
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Style ${name} must be a nonempty CSS string.`);
    if (name === 'colorScheme' && !['inherit', 'light', 'dark'].includes(value.trim())) throw new Error('Style colorScheme must be inherit, light or dark.');
    if (name !== 'colorScheme' && /^(inherit|initial|unset|revert|revert-layer)$/i.test(value.trim())) throw new Error(`Style ${name} cannot use a CSS reset keyword.`);
  }
  return { ...defaultReviewStyles, ...overrides };
}

export function applyReviewStyles(root, overrides) {
  const styles = resolveReviewStyles(overrides);
  // Validate the whole map before applying anything, using the browser's own CSS parser.
  for (const [name, value] of Object.entries(styles)) if (!CSS.supports(tokens[name][1], value)) throw new Error(`Invalid CSS value for style ${name}: ${value}`);
  for (const [name, value] of Object.entries(styles)) root.style.setProperty(tokens[name][0], value);
}
