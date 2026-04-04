import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Proje kökündeki .env dosyasını yükle (LexiCore-main/.env)
export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '..'),
})
