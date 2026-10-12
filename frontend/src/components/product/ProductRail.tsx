import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { CatalogProduct } from '../../types/catalog'
import { ProductTileSkeleton } from '../ui/Feedback'
import { ProductTile } from './ProductTile'

type ProductRailProps = {
  title: string
  eyebrow?: string
  products: CatalogProduct[]
  isLoading?: boolean
  viewAllHref?: string
  action?: ReactNode
  id?: string
}

/** Horizontally scrolling row of product tiles (swipe on touch, arrows on desktop). */
export function ProductRail({ title, eyebrow, products, isLoading = false, viewAllHref, action, id }: ProductRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const updateEdges = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    setEdges({ start: rail.scrollLeft <= 4, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges, products.length])

  if (!isLoading && !products.length) return null
  const scroll = (direction: 1 | -1) => railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * 0.9, behavior: 'smooth' })
  const headingId = `${id ?? title.replace(/\W+/g, '-').toLowerCase()}-title`

  return (
    <section className="sf-shelf" aria-labelledby={headingId} id={id}>
      <div className="sf-section-head">
        <div>
          {eyebrow && <span className="sf-eyebrow">{eyebrow}</span>}
          <h2 id={headingId} className="sf-section-title">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {action}
          {viewAllHref && <a className="sf-shelf-link" href={viewAllHref}>See all <ChevronRight size={15} aria-hidden="true" /></a>}
          <div className="sf-rail-nav">
            <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={`Scroll ${title} left`}><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={`Scroll ${title} right`}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
      <div className="sf-rail" ref={railRef} onScroll={updateEdges} data-lenis-prevent-horizontal>
        {isLoading
          ? Array.from({ length: 5 }, (_, index) => <ProductTileSkeleton key={index} />)
          : products.map((product) => <ProductTile key={product.id} product={product} />)}
      </div>
    </section>
  )
}
