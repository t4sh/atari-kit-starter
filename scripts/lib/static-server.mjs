import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
};

export function startStaticServer(root = 'out') {
  const output = path.resolve(root);
  const server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.replace(/^\/+/, '');
    const candidates = relative
      ? [
          relative,
          `${relative.replace(/\/$/, '')}/index.html`,
          `${relative.replace(/\/$/, '')}.html`,
        ]
      : ['index.html'];
    for (const candidate of candidates) {
      const file = path.resolve(output, candidate);
      if (!file.startsWith(`${output}${path.sep}`)) continue;
      try {
        const body = await fs.readFile(file);
        response.writeHead(200, {
          'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`,
        });
        response.end(body);
        return;
      } catch (_error) {
        // Try the next clean-URL candidate.
      }
    }
    response.writeHead(404);
    response.end('Not found');
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, url: `http://127.0.0.1:${server.address().port}` })
    )
  );
}
