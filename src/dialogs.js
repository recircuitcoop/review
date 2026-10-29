import { element } from './render.js';

/** Up/Down cycle focus through the dialog's buttons, matching a native menu. */
function moveFocusWithArrows(modal, event) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  const buttons = [...modal.querySelectorAll('button')];
  const index = buttons.indexOf(document.activeElement);
  const step = event.key === 'ArrowDown' ? 1 : -1;
  buttons[(index + step + buttons.length) % buttons.length].focus();
  event.preventDefault();
}

/**
 * At most one native modal per annotator. Every dialog gets a Cancel button,
 * closes with return value `cancel` on Escape, and restores the previous focus.
 */
export function createDialogs(root, idPrefix, isDestroyed) {
  let current = null;

  function open(title, content) {
    // A second request while one is open is ignored rather than stacked.
    if (current) return null;
    const previousFocus = document.activeElement;
    const modal = element('dialog', 'review-dialog');
    const heading = element('h2', '', title);
    heading.id = `${idPrefix}-dialog-title`;
    modal.setAttribute('aria-labelledby', heading.id);
    modal.append(heading, content);
    const dismiss = element('button', '', 'Cancel');
    dismiss.type = 'button';
    dismiss.addEventListener('click', () => modal.close('cancel'));
    modal.append(dismiss);
    root.append(modal);
    current = modal;
    modal.addEventListener('close', () => {
      current = null;
      modal.remove();
      if (!isDestroyed() && previousFocus?.isConnected) previousFocus.focus();
    }, { once: true });
    // Replace the browser's Escape handling so the return value is always `cancel`.
    modal.addEventListener('cancel', event => {
      event.preventDefault();
      modal.close('cancel');
    });
    modal.addEventListener('keydown', event => moveFocusWithArrows(modal, event));
    modal.showModal();
    modal.querySelector('button')?.focus();
    return modal;
  }

  return {
    open,
    close(value) {
      current?.close(value);
    },
    get isOpen() {
      return current !== null;
    },
  };
}

/** A column of buttons; each runs its own handler. */
export function choiceList(choices) {
  const content = element('div', 'review-choices');
  for (const { title, onChoose } of choices) {
    const button = element('button', '', title);
    button.type = 'button';
    button.addEventListener('click', onChoose);
    content.append(button);
  }
  return content;
}

/** Help body listing the effective (possibly remapped) shortcuts plus native selection keys. */
export function shortcutHelp(display) {
  const content = element('dl', 'review-shortcuts');
  for (const [command, keys] of Object.entries(display)) {
    content.append(element('dt', '', command), element('dd', '', keys.join(' / ')));
  }
  content.append(
    element('dt', '', 'Native selection'),
    element('dd', '', 'Tab / Shift+Tab: normal focus. In F2 mode: arrows move; Shift+arrows select; Ctrl+Shift+Left/Right (Windows/Linux) or Alt+Shift+Left/Right (macOS) extends by word.'),
  );
  return content;
}
