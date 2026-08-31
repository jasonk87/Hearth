import path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig } from 'vite';
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

export default defineConfig({
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
});
