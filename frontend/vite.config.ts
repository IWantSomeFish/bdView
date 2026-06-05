import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env') })

const BACKEND_PORT = process.env.BACKEND_PORT || '8080'
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 5173

export default defineConfig({
  plugins: [react()],
  server: {
    port: FRONTEND_PORT,
    proxy: {
      '/api': `http://localhost:${BACKEND_PORT}`,
    },
  },
})
