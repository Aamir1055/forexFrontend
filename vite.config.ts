import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Allow overriding base path explicitly via VITE_BASE_PATH, fallback to safe defaults
  const baseFromEnv = env.VITE_BASE_PATH && env.VITE_BASE_PATH.trim().length > 0
    ? env.VITE_BASE_PATH
    : (mode === 'production' ? '/brk-eye-adm/' : '/')

  return {
    plugins: [react()],
    server: {
      port: 5175,
      host: true,
      strictPort: false,
      watch: {
        ignored: ['**/.git/**', '**/node_modules/**']
      },
      proxy: {
        '/api': {
          target: 'http://185.136.159.142:8080',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    },
    // Single source of truth for base path
    base: baseFromEnv,
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    // Exclude .git and node_modules from being processed
    optimizeDeps: {
      exclude: ['.git', 'node_modules']
    }
  }
})
