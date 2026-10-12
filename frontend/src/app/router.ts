import { useSyncExternalStore } from 'react'

// Hash routes look like '#product/acacia-gold-honey' or '#honey?category=Honey&sort=price-low'.
// Frappe always serves the same shop.html, so routing lives entirely in the hash.
export type Route = { path: string; segments: string[]; params: URLSearchParams; hash: string }

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '')
  const [pathPart, query = ''] = raw.split('?', 2)
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent)
  return { path: segments[0] ?? '', segments, params: new URLSearchParams(query), hash }
}

export function buildHash(path: string, params?: Record<string, string | number | null | undefined> | URLSearchParams) {
  const search = params instanceof URLSearchParams ? new URLSearchParams(params) : new URLSearchParams()
  if (params && !(params instanceof URLSearchParams)) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') search.set(key, String(value))
    })
  }
  const query = search.toString()
  return `#${path}${query ? `?${query}` : ''}`
}

/** Change the hash; `replace` keeps filter tweaks out of the back-button history. */
export function navigate(hash: string, { replace = false } = {}) {
  if (hash === window.location.hash) return
  if (replace) {
    window.history.replaceState(window.history.state, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}

const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
const getHash = () => window.location.hash

let cached: Route = parseHash(getHash())
function getRoute() {
  const hash = getHash()
  if (hash !== cached.hash) cached = parseHash(hash)
  return cached
}

export function useRoute() {
  return useSyncExternalStore(subscribe, getRoute)
}
