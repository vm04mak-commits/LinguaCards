import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ngrok-header',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('ngrok-skip-browser-warning', 'true')
          next()
        })
      },
    },
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'unlowly-nonfugitively-genoveva.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.trycloudflare.com',
      'localhost',
    ],
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
