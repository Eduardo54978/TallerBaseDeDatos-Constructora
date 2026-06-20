import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

export default defineConfig({
  plugins: [react()],

  server: {
    host: 'localhost',
    port: 5173,

    https: {
      key: fs.readFileSync(
        new URL('./certs/localhost-key.pem', import.meta.url)
      ),
      cert: fs.readFileSync(
        new URL('./certs/localhost.pem', import.meta.url)
      ),
    },
  },
})