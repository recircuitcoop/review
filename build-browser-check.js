import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const result = await build({ entryPoints: ['tests/browser-check.js'], bundle: true, format: 'esm', platform: 'browser', write: false });
const css = await readFile('src/review.css', 'utf8');
await mkdir('test-results', { recursive: true });
await writeFile('test-results/browser-check.html', `<!doctype html><html lang="en"><meta charset="utf-8"><title>Running browser checks</title><style>${css}\n#fixtures { position: absolute; left: 0; top: 1200px; width: 1000px; } pre { white-space: pre-wrap; padding: 2rem; }</style><h1 id="summary">Running browser checks…</h1><pre id="results"></pre><div id="fixtures"></div><script type="module">${result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></html>`);
console.log('Open test-results/browser-check.html in a desktop browser.');

const pointer = await build({ entryPoints: ['tests/pointer-check.js'], bundle: true, format: 'esm', platform: 'browser', write: false });
await writeFile('test-results/pointer-check.html', `<!doctype html><html lang="en"><meta charset="utf-8"><title>Trusted pointer checks</title><style>${css}\n#scenarios, #report, #scroll {margin:1rem} #report {white-space:pre-wrap} .review-layout {grid-template-columns: minmax(0,1fr) 220px} #fixture {max-width:1100px}</style><h1>Trusted pointer checks</h1><div id="scenarios"></div><pre id="report">Choose a scenario.</pre><p id="scroll">Wheel scrolling not yet observed.</p><div id="fixture"></div><script type="module">${pointer.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></html>`);
