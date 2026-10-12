// Lazy page chunks, shared by App (React.lazy) and the prefetchers below.
export const loadProductPage = () => import('../pages/ProductDetailPage')
export const loadCommercePages = () => import('../pages/CommercePages')

const byPath: Record<string, () => Promise<unknown>> = {
  product: loadProductPage,
  cart: loadCommercePages,
  wishlist: loadCommercePages,
}

const chunkFor = (hash: string) => byPath[hash.replace(/^#/, '').split(/[/?]/)[0]]

/** Deep link (e.g. a shared #product/… URL): fetch the page chunk alongside the app, not after it. */
export function preloadInitialRoute() {
  void chunkFor(window.location.hash)?.()
}

/** Fetch a page's chunk when the shopper shows intent (hover, focus, touch) on a link to it. */
export function prefetchOnIntent() {
  const started = new Set<() => Promise<unknown>>()
  const onIntent = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.('a[href^="#"]')
    const load = link && chunkFor(link.getAttribute('href') ?? '')
    if (load && !started.has(load)) {
      started.add(load)
      void load()
    }
  }
  for (const type of ['pointerover', 'focusin', 'touchstart']) document.addEventListener(type, onIntent, { passive: true })
}
