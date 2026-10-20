/** Appearance is host state; changing it never remounts or edits a review. */
export function initializeTheme(button) {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const saved = window.localStorage.getItem('review-theme');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch { /* Offline file origins can deny preference storage. */ }
  function apply() {
    const dark = (preference ?? (system.matches ? 'dark' : 'light')) === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', 'Night theme');
    button.textContent = `Night theme: ${dark ? 'on' : 'off'}`;
    button.title = `Switch to ${dark ? 'light' : 'night'} theme`;
  }
  button.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); });
  button.addEventListener('click', () => {
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { window.localStorage.setItem('review-theme', preference); } catch { /* Keep the in-page preference. */ }
    apply();
  });
  system.addEventListener('change', () => { if (preference === null) apply(); });
  apply();
}
