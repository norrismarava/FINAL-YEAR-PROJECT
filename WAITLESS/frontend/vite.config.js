import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';

// Proxy target: explicit env override > sibling backend/.env PORT > 4242.
// Reading backend/.env keeps the proxy correct on machines whose backend
// port differs from the committed default.
function resolveProxyTarget() {
  if (process.env.VITE_PROXY_TARGET) return process.env.VITE_PROXY_TARGET;
  try {
    const envFile = readFileSync(path.resolve(__dirname, '../backend/.env'), 'utf8');
    const match = envFile.match(/^PORT=(\d+)/m);
    if (match) return `http://localhost:${match[1]}`;
  } catch {}
  return 'http://localhost:4242';
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'recharts': ['recharts'],
          'lottie': ['lottie-react', 'lottie-web'],
          'radix-ui': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: resolveProxyTarget(),
        changeOrigin: true,
      },
    },
  },
});