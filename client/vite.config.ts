import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6010,
    proxy: {
      '/api': {
        target: 'http://localhost:6001',
        changeOrigin: true,
      },
    },
  },
});
