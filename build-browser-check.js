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

const host = await build({ entryPoints: ['tests/host-check.js'], bundle: true, format: 'esm', platform: 'browser', write: false });
const shell = await readFile('index.html', 'utf8');
await writeFile('test-results/host-check.html', shell.replace('<link rel="stylesheet" href="/src/review.css">', () => `<style>${css}</style>`).replace('<script type="module" src="/src/app.js"></script>', () => `<script type="module">${host.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`));
