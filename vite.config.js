import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from the frontend .env file
dotenv.config({ path: './src/pages/.env' })

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Add proxy for API requests in development
      '/api': {
        target: 'https://job-portal-backend-629b.onrender.com',
        changeOrigin: true,
        secure: false,
        xfwd: true
      }
    },
    cors: true
  }
})
