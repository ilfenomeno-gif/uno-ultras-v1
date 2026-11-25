import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env['VITE_API_TARGET'] ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/colyseus.js') || id.includes('@colyseus')) {
            return 'vendor-colyseus';
          }
          if (id.includes('/shared/') || id.includes('\\shared\\')) {
            return 'uno-shared';
          }
          return undefined;
        },
      },
    },
  },
});
