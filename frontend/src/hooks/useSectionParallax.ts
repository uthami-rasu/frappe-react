import { useEffect, type RefObject } from 'react'

export function useSectionParallax(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0

    const update = () => {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const distance = rect.top + rect.height / 2 - window.innerHeight / 2
      const offset = Math.max(-80, Math.min(80, distance * -0.09))
      section.style.setProperty('--parallax-y', `${offset}px`)
      section.style.setProperty('--parallax-y-inverse', `${-offset}px`)
      section.style.setProperty('--parallax-panel-y', `${Math.min(0, offset * 0.65)}px`)
      section.style.setProperty('--parallax-content-y', `${offset * 0.36}px`)
      frame = 0
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [sectionRef])
}
