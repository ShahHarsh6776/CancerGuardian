import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import themePlugin from '@replit/vite-plugin-shadcn-theme-json'
import * as path from 'path'
import { fileURLToPath } from 'url'
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '..', 'shared'),
      '@assets': path.resolve(__dirname, '..', 'attached_assets'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '..', 'dist', 'public'),
    emptyOutDir: true,
  }
})
