import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './server/api.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const mime = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };

createServer(async (request, response) => {
  if (request.url.startsWith('/api/')) {
    const handled = await handleApiRequest(request, response);
    if (handled !== false) return;
    response.statusCode = 404; response.end('Not found'); return;
  }
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requested = path.resolve(dist, `.${pathname}`);
  const file = requested.startsWith(dist) && existsSync(requested) && (await stat(requested)).isFile() ? requested : path.join(dist, 'index.html');
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  createReadStream(file).pipe(response);
}).listen(Number(process.env.PORT || 3000), process.env.HOST || '0.0.0.0', () => console.log(`Hearth is listening on port ${process.env.PORT || 3000}`));
