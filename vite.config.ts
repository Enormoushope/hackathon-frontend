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
          // 外部ライブラリ
          if (id.includes('node_modules')) {
            if (id.includes('scheduler') || id.includes('/react/') || id.includes('/react-dom/')) {
              return 'vendor_react';
            }
            if (id.includes('axios')) {
              return 'vendor_axios';
            }
            if (id.includes('recharts')) return 'vendor_recharts';
            if (id.includes('@tanstack')) return 'vendor_tanstack';
            return 'vendor_misc';
          }
          // 機能ごと分割
          if (id.includes('/src/features/items/')) {
            return 'items';
          }
          if (id.includes('/src/features/users/')) {
            return 'users';
          }
          // 必要に応じて追加
        }
      }
    }
  }
})
