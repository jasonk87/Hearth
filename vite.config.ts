import path from 'path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { DEFAULT_PERSISTENT_STATE, PersistentAppState, PERSISTENT_STATE_KEYS } from './shared/persistentState';

const STATE_FILE = path.resolve(__dirname, 'data', 'hearth-state.json');

const readState = async (): Promise<{ state: PersistentAppState; isNew: boolean }> => {
  try {
    const stored = JSON.parse(await readFile(STATE_FILE, 'utf8')) as Partial<PersistentAppState>;
    return { state: { ...DEFAULT_PERSISTENT_STATE, ...stored }, isNew: false };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Unable to read persisted Hearth state:', error);
    }
    return { state: DEFAULT_PERSISTENT_STATE, isNew: true };
  }
};

const writeState = async (state: PersistentAppState) => {
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  // Writes are serialized below; direct replacement is Windows-safe, unlike rename-over-existing-file.
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
};

const readRequestBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 25 * 1024 * 1024) throw new Error('State payload is too large');
    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const sendJson = (response: ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
};

let stateWriteQueue = Promise.resolve();

const handleStateRequest = async (request: IncomingMessage, response: ServerResponse) => {
  if (request.method === 'GET') {
    sendJson(response, 200, await readState());
    return;
  }

  if (request.method === 'PATCH') {
    const body = await readRequestBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      sendJson(response, 400, { error: 'A JSON object is required.' });
      return;
    }

    const patch = Object.fromEntries(
      Object.entries(body).filter(([key]) => PERSISTENT_STATE_KEYS.includes(key as keyof PersistentAppState))
    ) as Partial<PersistentAppState>;

    stateWriteQueue = stateWriteQueue.catch(() => undefined).then(async () => {
      const { state } = await readState();
      await writeState({ ...state, ...patch });
    });
    await stateWriteQueue;
    sendJson(response, 200, { ok: true });
    return;
  }

  response.setHeader('Allow', 'GET, PATCH');
  sendJson(response, 405, { error: 'Method not allowed.' });
};

const persistentStatePlugin = () => ({
  name: 'hearth-persistent-state',
  configureServer(server: { middlewares: { use: Function } }) {
    server.middlewares.use('/api/state', (request: IncomingMessage, response: ServerResponse) => {
      void handleStateRequest(request, response).catch((error) => {
        console.error('Persistent state API error:', error);
        if (!response.headersSent) sendJson(response, 500, { error: 'Unable to persist Hearth data.' });
      });
    });
  },
  configurePreviewServer(server: { middlewares: { use: Function } }) {
    server.middlewares.use('/api/state', (request: IncomingMessage, response: ServerResponse) => {
      void handleStateRequest(request, response).catch((error) => {
        console.error('Persistent state API error:', error);
        if (!response.headersSent) sendJson(response, 500, { error: 'Unable to persist Hearth data.' });
      });
    });
  },
});

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/serp': {
        target: 'https://serpapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/serp/, ''),
      },
    },
  },
  plugins: [persistentStatePlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
