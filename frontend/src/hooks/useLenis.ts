import { useEffect } from 'react'
import Lenis from 'lenis'

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.08,
    })

    ;(window as any).lenis = lenis

    return () => {
      ;(window as any).lenis = null
      lenis.destroy()
    }
  }, [])
}
