import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default ({ mode }) => {
  const root = path.resolve(__dirname, '..');
  const env = loadEnv(mode, root, '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5001/api/v1';
  const proxyTarget = (() => {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return 'http://localhost:5001';
    }
  })();

  return defineConfig({
    envDir: root,
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 3002,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  });
};
