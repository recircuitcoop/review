import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// A single offline file lets users review Markdown without starting a server.
const result = await build({ entryPoints: ['src/app.js'], bundle: true, format: 'iife', platform: 'browser', write: false, legalComments: 'inline', minify: false });
const css = await readFile('src/review.css', 'utf8');
const source = await readFile('index.html', 'utf8');
const html = source
  .replace('<link rel="stylesheet" href="/src/review.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="/src/app.js"></script>', () => `<script>${result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);
await mkdir('dist', { recursive: true });
await writeFile('dist/review.html', html);
await build({ entryPoints: ['src/review.js'], bundle: true, format: 'esm', platform: 'browser', outfile: 'dist/review-lib.js', legalComments: 'inline' });
await writeFile('dist/review.css', css);
console.log('Built dist/review.html (offline app), dist/review-lib.js, and dist/review.css.');
