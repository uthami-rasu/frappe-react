import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BUILD_BASE = '/assets/bossco/frontend/'

type RoutePreload = { image?: string; page?: string }

/**
 * A shopper landing on a page would otherwise wait for the main script before the browser even
 * discovers that page's code and its hero image (a CSS background, the largest paint). This adds
 * a tiny inline script to index.html that, based on the URL hash, starts both downloads right
 * away, in parallel with the main script.
 */
function routePreload(routes: Record<string, RoutePreload>): Plugin {
  return {
    name: 'bossco-route-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const outputs = Object.values(context.bundle ?? {})
        const entry = outputs.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
        const loadedUpFront = new Set(entry && entry.type === 'chunk' ? [entry.fileName, ...entry.imports] : [])
        const assetUrl = (source: string) => {
          const asset = outputs.find((chunk) => chunk.type === 'asset' && (chunk.originalFileNames ?? []).some((name) => name.endsWith(source)))
          return asset && BUILD_BASE + asset.fileName
        }
        const chunkUrls = (source: string) => {
          const chunk = outputs.find((output) => output.type === 'chunk' && output.facadeModuleId?.endsWith(source))
          if (!chunk || chunk.type !== 'chunk') return []
          return [chunk.fileName, ...chunk.imports].filter((file) => !loadedUpFront.has(file)).map((file) => BUILD_BASE + file)
        }
        const plan: Record<string, { image?: string; modules: string[] }> = {}
        for (const [route, { image, page }] of Object.entries(routes)) {
          plan[route] = { image: image && assetUrl(image), modules: page ? chunkUrls(page) : [] }
        }
        const script = `<script>(function (plan) { var route = plan[location.hash.replace(/^#/, '').split(/[/?]/)[0]]; if (!route) return; function add(rel, href, as) { var link = document.createElement('link'); link.rel = rel; link.href = href; if (as) { link.as = as; link.setAttribute('fetchpriority', 'high') } document.head.appendChild(link) } if (route.image) add('preload', route.image, 'image'); route.modules.forEach(function (href) { add('modulepreload', href) }) })(${JSON.stringify(plan)});</script>`
        return html.replace('</head>', `  ${script}\n  </head>`)
      },
    },
  }
}

const homeHero = 'src/assets/images/ChatGPT Image Jun 10, 2026, 11_08_40 AM 1.webp'
const catalog = { image: 'src/assets/category/image copy.webp' }

// `yarn dev` proxies Frappe routes to the local bench; X-Frappe-Site-Name picks the site
// regardless of the bench's default site.
const frappeSite = process.env.FRAPPE_SITE ?? 'bossco.local'
const frappeUrl = process.env.FRAPPE_URL ?? 'http://127.0.0.1:8000'
const frappeProxy = { target: frappeUrl, headers: { 'X-Frappe-Site-Name': frappeSite } }

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    routePreload({
      '': { image: homeHero },
      home: { image: homeHero },
      honey: catalog,
      shop: catalog,
      search: catalog,
      product: { page: 'src/pages/ProductDetailPage.tsx' },
      cart: { page: 'src/pages/CommercePages.tsx' },
      checkout: { page: 'src/pages/CheckoutPage.tsx' },
    }),
  ],
  // Production assets are served by Frappe from bossco/public/frontend
  base: command === 'build' ? BUILD_BASE : '/',
  build: {
    outDir: '../bossco/public/frontend',
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        // one chunk for all icons instead of a request per icon shared by lazy pages
        codeSplitting: { groups: [{ name: 'icons', test: /node_modules[\\/]lucide-react/ }] },
      },
    },
  },
  server: {
    port: 8080,
    proxy: {
      '^/(api|app|assets|files|private|login)': frappeProxy,
    },
  },
}))
