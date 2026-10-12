import { useEffect } from 'react'
import Lenis from 'lenis'
import { setLenis } from '../app/lenis'

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.08,
    })

    setLenis(lenis)

    return () => {
      setLenis(null)
      lenis.destroy()
    }
  }, [])
}
