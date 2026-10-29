// Initial-release keyboard map. `Mod` resolves to Cmd on Apple platforms and Ctrl elsewhere.
const DEFAULT_SHORTCUTS = {
  nextBlock: ['Alt+ArrowDown'],
  previousBlock: ['Alt+ArrowUp'],
  selectBlock: ['Enter'],
  precise: ['F2'],
  left: ['Alt+ArrowLeft'],
  right: ['Alt+ArrowRight'],
  clear: ['Escape'],
  remove: ['Delete', 'Backspace'],
  nextAnnotation: ['Alt+N'],
  previousAnnotation: ['Alt+P'],
  undo: ['Mod+Z'],
  redo: ['Mod+Shift+Z', 'Ctrl+Y'],
  export: ['Mod+Shift+E'],
  finish: ['Mod+Enter'],
  help: ['F1'],
};
const MODIFIERS = ['ctrl', 'alt', 'shift', 'meta'];

function applyOverrides(effective, overrides) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('Shortcut overrides must be a command map.');
  }
  for (const [command, value] of Object.entries(overrides)) {
    if (!Object.hasOwn(effective, command)) {
      throw new Error(`Unknown shortcut command: ${command}`);
    }
    const keys = typeof value === 'string' ? [value] : value;
    const valid = Array.isArray(keys) && keys.length > 0 && keys.every(key => typeof key === 'string' && key.trim());
    if (!valid) {
      throw new Error(`Invalid shortcut for ${command}.`);
    }
    effective[command] = [...keys];
  }
}

/** Canonical lookup form: lowercase, sorted modifiers, key last (e.g. `ctrl+shift+z`). */
function normalizeChord(value, mac) {
  const parts = value.toLowerCase().replaceAll('mod', mac ? 'meta' : 'ctrl').split('+');
  const key = parts.pop();
  const unknownModifier = parts.some(part => !MODIFIERS.includes(part));
  const repeatedModifier = new Set(parts).size !== parts.length;
  if (!key || unknownModifier || repeatedModifier) {
    throw new Error(`Invalid shortcut: ${value}`);
  }
  return [...parts.sort(), key].join('+');
}

function eventChord(event) {
  const modifiers = [];
  if (event.ctrlKey) modifiers.push('ctrl');
  if (event.altKey) modifiers.push('alt');
  if (event.shiftKey) modifiers.push('shift');
  if (event.metaKey) modifiers.push('meta');
  return [...modifiers.sort(), event.key.toLowerCase()].join('+');
}

/** Human-readable chord: concrete Cmd/Ctrl instead of the abstract `Mod`. */
function displayChord(chord, mac) {
  return chord
    .replace(/\bmod\b/gi, mac ? 'Cmd' : 'Ctrl')
    .replace(/\bmeta\b/gi, mac ? 'Cmd' : 'Meta');
}

/**
 * Apple keyboard conventions (Cmd for Mod, Alt for word steps).
 * Prefers User-Agent Client Hints; navigator.platform covers engines without them.
 */
export function isApplePlatform() {
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  return /^(mac|iphone|ipad|ios)/i.test(platform);
}

/** aria-keyshortcuts names modifiers by their DOM key values (Meta, Control). */
function ariaChords(keys, mac) {
  return keys.join(' ')
    .replace(/\bmod\b/gi, mac ? 'Meta' : 'Control')
    .replace(/\bctrl\b/gi, 'Control');
}

/**
 * Resolve host overrides against the defaults and build the dispatcher.
 * Throws before mounting on unknown commands, malformed chords, or conflicts.
 */
export function shortcutMap(overrides = {}) {
  const mac = isApplePlatform();
  const effective = structuredClone(DEFAULT_SHORTCUTS);
  // Ctrl+Y redo is a Windows/Linux convention only.
  if (mac) {
    effective.redo = ['Mod+Shift+Z'];
  }
  applyOverrides(effective, overrides);

  const bindings = new Map();
  for (const [command, values] of Object.entries(effective)) {
    for (const value of values) {
      const chord = normalizeChord(value, mac);
      if (bindings.has(chord)) {
        throw new Error(`Shortcut conflict: ${value}`);
      }
      bindings.set(chord, command);
    }
  }

  const display = {};
  const aria = {};
  for (const [command, keys] of Object.entries(effective)) {
    display[command] = keys.map(key => displayChord(key, mac));
    aria[command] = ariaChords(keys, mac);
  }

  return {
    effective,
    display,
    aria,
    mac,
    command(event) {
      return bindings.get(eventChord(event));
    },
  };
}
