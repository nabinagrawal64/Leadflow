import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Optional: set VITE_DEV_PROXY to forward /api calls to the backend in dev
      proxy: env.VITE_DEV_PROXY
        ? { '/api': { target: env.VITE_DEV_PROXY, changeOrigin: true } }
        : undefined,
    },
  }
})
