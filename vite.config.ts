import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'scheduler'],
    exclude: []
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // React and scheduler MUST be together
          if (id.includes('scheduler') || id.includes('/react/') || id.includes('/react-dom/')) {
            return 'vendor_react';
          }
          
          // Large libraries split into chunks
          if (id.includes('recharts')) return 'vendor_recharts';
          if (id.includes('@tanstack')) return 'vendor_tanstack';

          // Fallback
          return 'vendor_misc';
        }
      }
    }
  }
})
