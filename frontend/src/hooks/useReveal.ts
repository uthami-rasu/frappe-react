import { useEffect } from 'react'

export function useReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }),
      { threshold: 0.12 },
    )

    const observeReveals = (root: ParentNode = document) => root.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element))
    observeReveals()

    // Hash navigation swaps the homepage and category page without a reload.
    // Observe newly mounted sections so their entrance motion still runs.
    const mutationObserver = new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        if (node.matches('[data-reveal]')) observer.observe(node)
        observeReveals(node)
      }
    })))
    mutationObserver.observe(document.getElementById('root')!, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])
}
