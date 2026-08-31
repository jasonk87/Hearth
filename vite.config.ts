import path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/api.mjs';

const apiPlugin = () => ({
  name: 'hearth-api',
  configureServer(server: { middlewares: { use: Function } }) {
    server.middlewares.use((request: IncomingMessage, response: ServerResponse, next: () => void) => {
      if (!request.url?.startsWith('/api/')) return next();
      void handleApiRequest(request, response).then(handled => { if (handled === false) next(); });
    });
  },
  configurePreviewServer(server: { middlewares: { use: Function } }) {
    server.middlewares.use((request: IncomingMessage, response: ServerResponse, next: () => void) => {
      if (!request.url?.startsWith('/api/')) return next();
      void handleApiRequest(request, response).then(handled => { if (handled === false) next(); });
    });
  },
});

export default defineConfig(({ mode }) => {
  // Server-only variables are deliberately unprefixed, so make them available
  // to the dev/preview API middleware without exposing them to browser code.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [apiPlugin(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
