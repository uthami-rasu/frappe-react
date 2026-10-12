import { useEffect, useRef } from 'react'

type ScrollProgressProps = {
  route?: string
}

export function ScrollProgress({ route }: ScrollProgressProps) {
  const readingBarRef = useRef<HTMLDivElement>(null)
  const navLoaderRef = useRef<HTMLDivElement>(null)

  // 1. YouTube-style Top Page Loader on navigation
  useEffect(() => {
    if (!route) return

    if (navLoaderRef.current) {
      navLoaderRef.current.style.opacity = '1'
      navLoaderRef.current.style.width = '0%'
      navLoaderRef.current.style.transition = 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)'

      requestAnimationFrame(() => {
        if (navLoaderRef.current) navLoaderRef.current.style.width = '70%'
      })

      const timer1 = setTimeout(() => {
        if (navLoaderRef.current) navLoaderRef.current.style.width = '100%'
      }, 240)

      const timer2 = setTimeout(() => {
        if (navLoaderRef.current) navLoaderRef.current.style.opacity = '0'
      }, 480)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [route])

  // 2. Reading Progress Bar (Lenis + Native Scroll)
  useEffect(() => {
    const updateReadingProgress = (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress))
      if (readingBarRef.current) {
        readingBarRef.current.style.transform = `scaleX(${clamped})`
      }
    }

    const calcNativeProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0
      updateReadingProgress(progress)
    }

    let lenisAdded = false
    const attachLenis = () => {
      const lenis = (window as any).lenis
      if (lenis && typeof lenis.on === 'function') {
        lenis.on('scroll', (e: { progress: number }) => {
          updateReadingProgress(e.progress)
        })
        lenisAdded = true
      }
    }

    attachLenis()
    const timer = setTimeout(attachLenis, 300)

    const onNativeScroll = () => {
      if (!lenisAdded) {
        calcNativeProgress()
      }
    }

    calcNativeProgress()
    window.addEventListener('scroll', onNativeScroll, { passive: true })
    window.addEventListener('resize', calcNativeProgress)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onNativeScroll)
      window.removeEventListener('resize', calcNativeProgress)
    }
  }, [])

  return (
    <>
      {/* Top Page Navigation Loading Flash */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100001] h-[3px] bg-transparent"
      >
        <div
          ref={navLoaderRef}
          className="h-full w-0 bg-gradient-to-r from-[#173f32] via-[#d97706] to-[#f59e0b] shadow-[0_0_14px_rgba(245,158,11,0.9),0_0_8px_rgba(23,63,50,0.8)] transition-all duration-300 ease-out opacity-0"
        />
      </div>

      {/* Top Reading Progress Bar */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100000] h-[4px] bg-stone-900/10 dark:bg-stone-100/10 backdrop-blur-[1px]"
        aria-label="Reading progress"
      >
        <div
          ref={readingBarRef}
          className="relative h-full origin-left scale-x-0 bg-gradient-to-r from-[#173f32] via-[#d97706] to-[#f59e0b] shadow-[0_0_14px_rgba(245,158,11,0.85),0_0_6px_rgba(23,63,50,0.6)] transition-transform duration-75 ease-out will-change-transform"
        >
          {/* Glowing leading edge cap */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-2.5 rounded-full bg-[#fde047] border border-white/80 shadow-[0_0_10px_#f59e0b,0_0_4px_#173f32]" />
        </div>
      </div>
    </>
  )
}
