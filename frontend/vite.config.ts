import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `yarn dev` proxies Frappe routes to the local bench; X-Frappe-Site-Name picks the site
// regardless of the bench's default site.
const frappeSite = process.env.FRAPPE_SITE ?? 'bossco.local'
const frappeUrl = process.env.FRAPPE_URL ?? 'http://127.0.0.1:8000'
const frappeProxy = { target: frappeUrl, headers: { 'X-Frappe-Site-Name': frappeSite } }

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Production assets are served by Frappe from bossco/public/frontend
  base: command === 'build' ? '/assets/bossco/frontend/' : '/',
  build: {
    outDir: '../bossco/public/frontend',
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    proxy: {
      '^/(api|app|assets|files|private|login)': frappeProxy,
    },
  },
}))
