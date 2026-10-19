import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/plain' };
const port = Number(process.env.PORT || 4173);

export async function handleRequest(request, response) {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replaceAll('\\', '/');
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep) || pathname.split('/').some(p => p.startsWith('.'))) { response.writeHead(403); response.end(); return; }
    if (!(await stat(path)).isFile()) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, {
      'Content-Type': `${types[extname(path)] || 'application/octet-stream'}; charset=utf-8`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    response.end(request.method === 'HEAD' ? undefined : await readFile(path));
  } catch { response.writeHead(404); response.end('Not found'); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer(handleRequest);
  server.on('error', error => { console.error(`Cannot start local server: ${error.message}. You can open dist/review.html without a server.`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Review: http://127.0.0.1:${port}`));
}
