import { useEffect, useRef, useState } from 'react'

type CountUpProps = {
  value: string
  duration?: number
}

/** Splits "10k+" into ["10", "k+"] and "24/7" into ["24", "/", "7"]. */
const splitValue = (value: string) => value.split(/(\d+)/).filter(Boolean)

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Counts every number inside a stat string up from zero the first time it
 * scrolls into view. A hidden copy of the final string reserves the width so
 * growing digits don't shift the layout.
 */
export function CountUp({ value, duration = 1700 }: CountUpProps) {
  const parts = splitValue(value)
  const ref = useRef<HTMLSpanElement>(null)
  const [progress, setProgress] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0,
  )

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    let start = 0

    const step = (now: number) => {
      if (!start) start = now
      const elapsed = Math.min((now - start) / duration, 1)
      setProgress(easeOut(elapsed))
      if (elapsed < 1) frame = window.requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        frame = window.requestAnimationFrame(step)
      },
      { threshold: 0.5 },
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [duration])

  return (
    <span className="count-up" ref={ref}>
      <span className="sr-only">{value}</span>
      <span className="count-up-ghost" aria-hidden="true">{value}</span>
      <span className="count-up-live" aria-hidden="true">
        {parts.map((part, index) => (
          <span key={index}>{/^\d+$/.test(part) ? Math.round(Number(part) * progress) : part}</span>
        ))}
      </span>
    </span>
  )
}
