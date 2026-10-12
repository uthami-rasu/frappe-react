import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Renders `children` only once the placeholder is within `margin` of the viewport.
 * Keeps below-the-fold product rows from adding to the first render's work.
 */
export function RenderWhenVisible({ children, minHeight, margin = '600px' }: { children: ReactNode; minHeight: number; margin?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const element = ref.current
    if (visible || !element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: margin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [visible, margin])
  if (visible) return <>{children}</>
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />
}
