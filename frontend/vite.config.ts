import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const { VITE_API_PROXY_TARGET } = loadEnv(mode, process.cwd(), 'VITE_');
  const apiTarget = VITE_API_PROXY_TARGET || 'http://127.0.0.1:4000';

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              const code = (err as NodeJS.ErrnoException).code;
              if (code === 'ECONNABORTED' || code === 'ECONNRESET' || code === 'EPIPE') {
                return;
              }
              if (code === 'ECONNREFUSED') {
                console.warn(
                  `API backend is unavailable at ${apiTarget}. Start MongoDB and run "npm run dev" in the backend folder.`
                );
                return;
              }
              console.warn('API proxy warning:', err.message);
            });
          },
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
          rewriteWsOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              const code = (err as NodeJS.ErrnoException).code;
              if (code === 'ECONNABORTED' || code === 'ECONNRESET' || code === 'EPIPE') {
                return;
              }
              console.warn('Socket.IO proxy error:', err.message);
            });
            proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
              socket.on('error', (err: NodeJS.ErrnoException) => {
                if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                  return;
                }
                console.warn('Socket client error:', err.message);
              });
            });
            proxy.on('open', (proxySocket) => {
              proxySocket.on('error', (err: NodeJS.ErrnoException) => {
                if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                  return;
                }
                console.warn('Proxy target socket error:', err.message);
              });
            });
          },
        },
      },
    },
  };
});
