import type Lenis from 'lenis'

// The smooth-scroll instance (hooks/useLenis), shared with code that scrolls or locks scrolling
let instance: Lenis | null = null

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis
}
export const getLenis = () => instance
