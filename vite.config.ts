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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // React dependencies - must include scheduler separately
          if (id.includes('scheduler')) return 'vendor_react';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor_react';
          
          // Large libraries split into logical vendor chunks
          if (id.includes('recharts')) return 'vendor_recharts';
          if (id.includes('@tanstack') || id.includes('react-query')) return 'vendor_tanstack';
          if (id.includes('@rainbow-me') || id.includes('wagmi') || id.includes('viem') || id.includes('wallet') || id.includes('coinbase')) return 'vendor_wallet';

          // Fallback for other node_modules
          return 'vendor_misc';
        }
      }
    }
  }
})
