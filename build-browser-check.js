import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const result = await build({ entryPoints: ['tests/browser-check.js'], bundle: true, format: 'esm', platform: 'browser', write: false });
const css = await readFile('src/review.css', 'utf8');
await mkdir('test-results', { recursive: true });
const core = await readFile('tests/browser-check.html', 'utf8');
await writeFile('test-results/browser-check.html', core.replace('<link rel="stylesheet" href="../src/review.css">', () => `<style>${css}</style>`).replace('<script type="module" src="./browser-check.js"></script>', () => `<script type="module">${result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`));
console.log('Open test-results/browser-check.html in a desktop browser.');

const styling = await build({ entryPoints: ['tests/style-check.js'], bundle: true, format: 'esm', platform: 'browser', write: false });
const stylePage = await readFile('tests/style-check.html', 'utf8');
await writeFile('test-results/style-check.html', stylePage.replace('<link rel="stylesheet" href="../src/review.css">', () => `<style>${css}</style>`).replace('<script type="module" src="./style-check.js"></script>', () => `<script type="module">${styling.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`));

const pointer = await build({ entryPoints: ['tests/pointer-check.js'], bundle: true, format: 'esm', platform: 'browser', write: false });
await writeFile('test-results/pointer-check.html', `<!doctype html><html lang="en"><meta charset="utf-8"><title>Trusted pointer checks</title><style>${css}\n#scenarios, #report, #scroll {margin:1rem} #report {white-space:pre-wrap} .review-layout {grid-template-columns: minmax(0,1fr) 220px} #fixture {max-width:1100px}</style><h1>Trusted pointer checks</h1><div id="scenarios"></div><pre id="report">Choose a scenario.</pre><p id="scroll">Wheel scrolling not yet observed.</p><div id="fixture"></div><script type="module">${pointer.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></html>`);

const host = await build({ entryPoints: ['tests/host-check.js'], bundle: true, format: 'esm', platform: 'browser', write: false });
const shell = await readFile('index.html', 'utf8');
await writeFile('test-results/host-check.html', shell.replace('<link rel="stylesheet" href="/src/review.css">', () => `<style>${css}</style>`).replace('<script type="module" src="/src/app.js"></script>', () => `<script type="module">${host.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`));
