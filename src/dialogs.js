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

  function open(title, content, dismissLabel = 'Cancel') {
    // A second request while one is open is ignored rather than stacked.
    if (current) return null;
    const previousFocus = document.activeElement;
    const modal = element('dialog', 'review-dialog');
    const heading = element('h2', '', title);
    heading.id = `${idPrefix}-dialog-title`;
    modal.setAttribute('aria-labelledby', heading.id);
    modal.append(heading, content);
    const dismiss = element('button', '', dismissLabel);
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

// Keycap text for keys whose DOM names read poorly.
const KEY_NAMES = { arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓', escape: 'Esc' };

/** One displayed chord as keycaps. The visible '+' keeps the text identical to the effective mapping. */
function keycaps(chord) {
  const caps = element('span', 'review-key-chord');
  chord.split('+').forEach((part, index) => {
    if (index > 0) caps.append('+');
    caps.append(element('kbd', '', KEY_NAMES[part.toLowerCase()] ?? part));
  });
  return caps;
}

function keyRow(label, chords) {
  const combo = element('span', 'review-key-combo');
  chords.forEach((chord, index) => {
    if (index > 0) combo.append(' / ');
    combo.append(keycaps(chord));
  });
  const row = element('div', 'review-key-row');
  row.append(element('span', '', label), combo);
  return row;
}

/**
 * Shortcut help: keycaps for the effective (possibly remapped) platform mapping and the
 * actual label names. Labeling, history and completion first; selection and navigation
 * in an expandable section.
 */
export function shortcutHelp({ display, mac, left, right }) {
  const content = element('div', 'review-keys');
  content.append(
    keyRow(`Label ${left.name}`, display.left),
    keyRow(`Label ${right.name}`, display.right),
    keyRow('Clear selection / close', display.clear),
    keyRow('Delete annotation', display.remove),
    keyRow('Undo', display.undo),
    keyRow('Redo', display.redo),
    keyRow('Export files', display.export),
    keyRow('Done', display.finish),
  );
  const details = element('details');
  details.append(
    element('summary', '', 'Selection & navigation'),
    keyRow('Next block', display.nextBlock),
    keyRow('Previous block', display.previousBlock),
    keyRow('Select focused block', display.selectBlock),
    keyRow('Precise selection', display.precise),
    keyRow('Extend exact selection (precise mode)', ['Shift+ArrowLeft', 'Shift+ArrowRight']),
    // Native word steps: Alt on macOS, Ctrl elsewhere (matches movePreciseCaret).
    keyRow('Extend selection by word', [mac ? 'Alt+Shift+ArrowLeft' : 'Ctrl+Shift+ArrowLeft', mac ? 'Alt+Shift+ArrowRight' : 'Ctrl+Shift+ArrowRight']),
    keyRow('Next annotation', display.nextAnnotation),
    keyRow('Previous annotation', display.previousAnnotation),
    keyRow('Choose overlapping annotation', ['ArrowUp', 'ArrowDown', 'Enter']),
    keyRow('Move between controls', ['Tab', 'Shift+Tab']),
    keyRow('Show this help', display.help),
  );
  content.append(
    details,
    element('p', 'review-keys-note', 'Scroll left or right over selected text to label it. Escape closes this popup first; your selection stays. Undo reverses the latest annotation change and clears pending text.'),
  );
  return content;
}
