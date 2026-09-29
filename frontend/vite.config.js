import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Enable React JSX and automatic page updates during development.
export default defineConfig({
  plugins: [react()],
  // Use a dedicated port so other local React projects do not conflict.
  server: { port: 5174, strictPort: true },
})
