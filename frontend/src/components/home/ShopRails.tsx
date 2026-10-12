import { useMemo } from 'react'
import { useAppSelector } from '../../app/hooks'
import { isDeal } from '../../features/catalog/catalogQuery'
import { useCatalog } from '../../hooks/useCatalog'
import type { CatalogProduct } from '../../types/catalog'
import { ProductRail } from '../product/ProductRail'

const RAIL_SIZE = 10

/** Home page product rows, all computed from live catalog data (orders, reviews, prices). */
export function ShopRails() {
  const { products, isLoading } = useCatalog()
  const wishlist = useAppSelector((state) => state.commerce.wishlist)
  const recentlyViewed = useAppSelector((state) => state.commerce.recentlyViewed)

  const rails = useMemo(() => {
    const available = products.filter((product) => product.inStock)
    const bestSellers = [...available].filter((product) => product.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, RAIL_SIZE)
    const topRated = [...available].filter((product) => product.reviews > 0).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, RAIL_SIZE)
    const deals = available.filter(isDeal).slice(0, RAIL_SIZE)
    // "Recommended": more from the categories the shopper saved or looked at
    const interest = new Set([...wishlist, ...recentlyViewed].map((id) => products.find((product) => product.id === id)?.category).filter(Boolean))
    const seen = new Set([...wishlist, ...recentlyViewed])
    const recommended = interest.size
      ? available.filter((product) => interest.has(product.category) && !seen.has(product.id)).sort((a, b) => b.sold - a.sold || b.rating - a.rating).slice(0, RAIL_SIZE)
      : []
    return { bestSellers, topRated, deals, recommended }
  }, [products, wishlist, recentlyViewed])

  return (
    <div className="bg-[var(--sf-canvas)]">
      <div className="sf-container">
        <ProductRail id="best-sellers" title="Best sellers" eyebrow="Most ordered this season" products={rails.bestSellers} isLoading={isLoading} viewAllHref="#honey?sort=popular" />
        <ProductRail id="deals" title="Today’s deals" eyebrow="Marked down" products={rails.deals} viewAllHref="#honey?deals=1" />
        <ProductRail id="recommended" title="Recommended for you" eyebrow="Based on your browsing" products={rails.recommended} />
        <ProductRail id="top-rated" title="Top rated by customers" eyebrow="From verified reviews" products={rails.topRated} viewAllHref="#honey?sort=rating" />
      </div>
    </div>
  )
}

export function RecentlyViewedRail() {
  const { products } = useCatalog()
  const recentlyViewed = useAppSelector((state) => state.commerce.recentlyViewed)
  const recent = recentlyViewed.map((id) => products.find((product) => product.id === id)).filter((product): product is CatalogProduct => Boolean(product))
  if (!recent.length) return null
  return (
    <div className="bg-white dark:bg-stone-950">
      <div className="sf-container">
        <ProductRail id="recently-viewed" title="Your browsing history" eyebrow="Recently viewed" products={recent} />
      </div>
    </div>
  )
}
