import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            const code = (err as any)?.code;
            if (code === 'ECONNABORTED' || code === 'ECONNRESET' || code === 'EPIPE') {
              return;
            }
            console.warn('API proxy warning:', err.message);
          });
        },
      },
      '/socket.io': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        ws: true,
        secure: false,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            const code = (err as any)?.code;
            if (code === 'ECONNABORTED' || code === 'ECONNRESET' || code === 'EPIPE') {
              return;
            }
            console.warn('Socket.IO proxy error:', err.message);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err: any) => {
              if (err?.code === 'ECONNABORTED' || err?.code === 'ECONNRESET' || err?.code === 'EPIPE') {
                return;
              }
              console.warn('Socket client error:', err?.message);
            });
          });
          proxy.on('open', (proxySocket) => {
            proxySocket.on('error', (err: any) => {
              if (err?.code === 'ECONNABORTED' || err?.code === 'ECONNRESET' || err?.code === 'EPIPE') {
                return;
              }
              console.warn('Proxy target socket error:', err?.message);
            });
          });
        },
      },
    },
  },
});
