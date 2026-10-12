import { useMemo, useState, useRef } from 'react'
import { uniqueCategories, useCatalog } from '../../hooks/useCatalog'
import { CategoryFilters } from './CategoryFilters'
import { ProductGrid } from './ProductGrid'
import { ProductGridSkeleton } from '../ui/Feedback'
import { useSectionParallax } from '../../hooks/useSectionParallax'
import leftNuts from '../../assets/images/ChatGPT Image Jun 12, 2026, 04_05_10 PM 4.webp'
import rightNuts from '../../assets/images/ChatGPT Image Jun 12, 2026, 04_05_10 PM 3.webp'

export function FavoritesSection() {
  const { products, isLoading } = useCatalog()
  const favoriteProducts = useMemo(() => products.filter((product) => product.featured), [products])
  const categories = useMemo(() => uniqueCategories(favoriteProducts), [favoriteProducts])
  const [activeFilter, setActiveFilter] = useState('All')
  const sectionRef = useRef<HTMLElement>(null)
  useSectionParallax(sectionRef)
  const visibleProducts = activeFilter === 'All'
    ? favoriteProducts
    : favoriteProducts.filter((product) => product.category === activeFilter)

  return (
    <section
      ref={sectionRef}
      className="favorites-parallax-section relative z-10 overflow-hidden px-5 pb-24 pt-16 text-center sm:px-8"
      id="favorites"
    >
      <img className="favorites-parallax-left pointer-events-none absolute -bottom-28 -left-24 -z-10 hidden w-[320px] select-none opacity-35 lg:block" src={leftNuts} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <img className="favorites-parallax-right pointer-events-none absolute -bottom-28 -right-24 -z-10 hidden w-[320px] select-none opacity-35 lg:block" src={rightNuts} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <div className="favorites-orbit favorites-orbit-one" aria-hidden="true" />
      <div className="favorites-orbit favorites-orbit-two" aria-hidden="true" />
      <div className="favorites-depth-content">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 shadow-sm mb-3">
            ✨ Hand-curated Selection
          </span>
          <h2 className="font-display text-[clamp(2.6rem,5vw,4.5rem)] font-bold leading-none tracking-[-0.04em] text-[#173f32] dark:text-stone-100">
            Everyday Favourites
          </h2>
          <span className="mx-auto mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 shadow-[0_0_10px_#f59e0b]" />
          <p className="mt-4 text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
            From desk-drawer artisan jars to thoughtful luxury gift sets—find a better taste for every special moment.
          </p>
        </div>

        <div className="relative z-20 mt-8">
          <CategoryFilters activeFilter={activeFilter} categories={categories} onChange={setActiveFilter} />
        </div>
        <div className="relative z-20 mt-14">
          {isLoading ? <div className="mx-auto max-w-[1340px] text-left"><ProductGridSkeleton count={4} label="Loading favourites" /></div> : <ProductGrid products={visibleProducts} />}
        </div>
      </div>
    </section>
  )
}
