import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    return {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ai: ['@google/genai']
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild',
        sourcemap: false
      },
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : []
      }
    };
});
