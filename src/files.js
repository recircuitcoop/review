import { validateOptions } from './model.js';

function filenamePart(value) {
  const result = value.normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f-\u009f]/g, '_').replace(/[. ]+$/u, '');
  if (!result.trim()) throw new Error('Export filename components cannot be empty. Rename the document or label.');
  return result;
}

/** Host filenames only: annotation metadata and stable label IDs stay unchanged. */
export function exportFiles(filename, data) {
  const base = filenamePart(filename.replace(/\.(md|markdown)$/i, ''));
  const payloads = Array.isArray(data) ? data : [data];
  const files = payloads.map(payload => {
    const ids = Object.keys(payload.selections);
    const label = ids.length === 1 ? payload.labels.find(label => label.id === ids[0]) : null;
    if (ids.length === 1 && !label) throw new Error('Export label metadata is missing.');
    return { name: `${base}_${label ? filenamePart(label.name) : 'all'}.json`, content: JSON.stringify(payload, null, 2) + '\n' };
  });
  if (new Set(files.map(file => file.name.toLowerCase())).size !== files.length) throw new Error('Export filenames collide. Use distinct label names.');
  return files;
}

export async function readDocument(file) {
  const markdown = await file.text();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(markdown));
  const version = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return { id: file.name, version, markdown };
}

export function savedReviewOptions(document, payload) {
  const payloads = Array.isArray(payload) ? payload : [payload];
  if (payloads.length < 1 || payloads.length > 2) throw new Error('Open one grouped JSON or both split JSON files.');
  if (payloads.length === 1 && Object.keys(payloads[0]?.selections ?? {}).length === 1) throw new Error('Select both split JSON files; the partner file is required even when empty.');
  const saved = payloads[0];
  validateOptions({ document: saved?.document, labels: saved?.labels });
  if (saved.document.id !== document.id || saved.document.version !== document.version) throw new Error('Original Markdown source identity or version does not match the saved review.');
  return { document, labels: structuredClone(saved.labels) };
}
