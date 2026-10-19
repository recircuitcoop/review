import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../server.js';

async function request(url, method = 'GET') {
  const result = {};
  await handleRequest({ url, method }, {
    writeHead(status, headers = {}) { result.status = status; result.headers = headers; },
    end(body) { result.body = body; },
  });
  return result;
}
test('browser ES modules have JavaScript MIME types, including .mjs dependencies', async () => {
  const response = await request('/node_modules/dompurify/dist/purify.es.mjs');
  assert.equal(response.status, 200);
  assert.equal(response.headers['Content-Type'], 'text/javascript; charset=utf-8');
  assert.equal(response.headers['X-Content-Type-Options'], 'nosniff');
});
test('static server handles root, HEAD, missing files, and unsupported methods', async () => {
  assert.match(String((await request('/')).body), /Markdown file/);
  assert.equal((await request('/', 'HEAD')).body, undefined);
  assert.equal((await request('/not-found')).status, 404);
  assert.equal((await request('/', 'POST')).status, 405);
});
test('static server rejects hidden files and encoded traversal without exposing external files', async () => {
  assert.equal((await request('/.serena/project.yml')).status, 403);
  assert.equal((await request('/%2e%2e%2f%2e%2e%2fetc/passwd')).status, 403);
  assert.equal((await request('/%5c.serena/project.yml')).status, 403);
  assert.equal((await request('/..%5c..%5cetc/passwd')).status, 403);
  assert.equal((await request('/%')).status, 404);
});
