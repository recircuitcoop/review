import { mountReview } from './review.js';
import { exportFiles, readDocument, savedReviewOptions } from './files.js';

const form = document.querySelector('#setup');
const container = document.querySelector('#annotator');
const status = document.querySelector('#host-status');
const downloads = document.querySelector('#downloads');
let review = null, filename = '', urls = [];
function message(text) { status.textContent = text; }
function clearDownloads() { for (const url of urls) URL.revokeObjectURL(url); urls = []; downloads.replaceChildren(); }
function save(data) {
  const files = exportFiles(filename, data);
  const links = [], nextUrls = [];
  try {
    for (const file of files) {
      const blob = new Blob([file.content], { type: 'application/json' });
      const url = URL.createObjectURL(blob); nextUrls.push(url);
      const link = document.createElement('a'); link.className = 'download-link'; link.href = url;
      link.download = file.name; link.textContent = `Download ${file.name}`; links.push(link);
    }
  } catch (error) { for (const url of nextUrls) URL.revokeObjectURL(url); throw error; }
  clearDownloads(); urls = nextUrls; downloads.replaceChildren(...links);
  message(`${files.length} JSON ${files.length === 1 ? 'file is' : 'files are'} ready. Click each download link to save the files. The review remains available.`);
}

function installReview(options, payload) {
  const nextContainer = document.createElement('div');
  let next;
  try {
    next = mountReview(nextContainer, { ...options, exportFormat: document.querySelector('#export-format').value, onFinish: save });
    if (payload) next.restore(payload);
    if (review && !confirm('Replace the current review? Export any work you want to keep before continuing.')) { next.destroy(); return; }
  } catch (error) { next?.destroy(); throw error; }
  review?.destroy(); review = next; filename = options.document.id;
  container.replaceChildren(nextContainer); clearDownloads();
  nextContainer.addEventListener('review:export', event => { try { save(event.detail); } catch (error) { message(`Export failed: ${error.message}. Annotations are retained; retry Export files.`); } });
  nextContainer.addEventListener('review:error', event => message(event.detail.message));
  for (const type of ['create', 'update', 'delete']) nextContainer.addEventListener(`review:${type}`, () => {
    if (!urls.length) return;
    clearDownloads(); message('Annotations changed. Export again to download the current labels.');
  });
  document.querySelector('#left-label').value = options.labels.find(label => label.direction === 'left').name;
  document.querySelector('#right-label').value = options.labels.find(label => label.direction === 'right').name;
  document.querySelector('#host-actions').hidden = false;
  message(payload ? `Reopened ${filename} with ${review.read().length} annotations. Saved labels and IDs are preserved.` : `Reviewing ${filename}. Select a block or drag a range, then choose a label.`);
  nextContainer.querySelector('.review-document').focus();
}

const reopen = document.querySelector('#reopen');
// File/loading controls must not discard pending work before a candidate is validated.
for (const controls of [form, reopen, document.querySelector('#host-actions')]) controls.addEventListener('pointerdown', event => event.stopPropagation());
async function load(operation) {
  const buttons = [form, reopen].map(form => form.querySelector('button[type=submit]'));
  if (buttons.some(button => button.disabled)) return;
  buttons.forEach(button => { button.disabled = true; });
  try { await operation(); }
  catch (error) { message(`Could not open review: ${error.message}`); }
  finally { buttons.forEach(button => { button.disabled = false; }); }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  void load(async () => {
    const file = document.querySelector('#markdown-file').files[0];
    if (!file) throw new Error('Choose a Markdown file first.');
    const left = document.querySelector('#left-label').value.trim(), right = document.querySelector('#right-label').value.trim();
    if (!left || !right) throw new Error('Both label names are required.');
    const source = await readDocument(file);
    installReview({ document: source, labels: [{ id: 'left', name: left, direction: 'left' }, { id: 'right', name: right, direction: 'right' }] });
  });
});
reopen.addEventListener('submit', event => {
  event.preventDefault();
  void load(async () => {
    const file = document.querySelector('#reopen-markdown').files[0];
    const files = [...document.querySelector('#saved-files').files];
    if (!file || !files.length) throw new Error('Choose the original Markdown and saved annotation JSON.');
    const payloads = await Promise.all(files.map(async file => JSON.parse(await file.text())));
    const payload = payloads.length === 1 ? payloads[0] : payloads;
    const source = await readDocument(file);
    installReview(savedReviewOptions(source, payload), payload);
  });
});

document.querySelector('#restore-files').addEventListener('change', async event => {
  if (!review) return;
  try {
    const files = [...event.target.files]; if (!files.length) return;
    const payloads = await Promise.all(files.map(async file => JSON.parse(await file.text())));
    const payload = payloads.length === 1 ? payloads[0] : payloads;
    if (review.read().length && !confirm('Replace the current annotations with these saved annotations?')) return;
    review.restore(payload);
    clearDownloads(); message(`Restored ${review.read().length} annotations for ${filename}.`);
  } catch (err) { message(`Restore failed: ${err.message}`); }
  finally { event.target.value = ''; }
});

window.addEventListener('beforeunload', event => {
  if (!review?.read().length) return;
  event.preventDefault(); event.returnValue = '';
});
window.addEventListener('pagehide', clearDownloads);
