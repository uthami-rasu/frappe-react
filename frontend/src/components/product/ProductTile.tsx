import { memo } from 'react'
import { discountPercent, isDeal } from '../../features/catalog/catalogQuery'
import type { CatalogProduct } from '../../types/catalog'
import { Price } from '../ui/Price'
import { Rating } from '../ui/Stars'
import { productHref, stockState } from '../../utils/product'
import { AddToCartButton } from './AddToCartButton'
import { WishlistButton } from './WishlistButton'

type ProductTileProps = {
  product: CatalogProduct
  layout?: 'grid' | 'list' | 'compact'
  // the first row of a page is likely above the fold
  priority?: boolean
  showAdd?: boolean
  reason?: string
}

/** The storefront's one product card: image, name, rating, price, availability and actions. */
export const ProductTile = memo(function ProductTile({ product, layout = 'grid', priority = false, showAdd = true, reason }: ProductTileProps) {
  const stock = stockState(product)
  const href = productHref(product)
  return (
    <article className={`sf-tile sf-tile-${layout}`} aria-labelledby={`tile-${product.id}`}>
      <a href={href} className={`sf-tile-media ${product.inStock ? '' : 'is-out'}`} tabIndex={-1} aria-hidden="true">
        <img
          src={product.image}
          alt=""
          width={400}
          height={400}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </a>
      <div className="sf-tile-badges">
        {isDeal(product) ? (
          <span className="sf-badge sf-badge-deal">{discountPercent(product)}% off</span>
        ) : (
          product.badge && <span className="sf-badge sf-badge-brand">{product.badge}</span>
        )}
      </div>
      <div className="sf-tile-wish"><WishlistButton product={product} /></div>
      <div className="sf-tile-body">
        <span className="sf-tile-meta">{reason ?? [product.category, product.size].filter(Boolean).join(' · ')}</span>
        <a id={`tile-${product.id}`} href={href} className="sf-tile-name">{product.name}</a>
        {layout === 'list' && product.subtitle && <p className="sf-tile-sub">{product.subtitle}</p>}
        <div className="sf-tile-rating">{product.reviews > 0 && <Rating rating={product.rating} reviews={product.reviews} size={14} />}</div>
        <div className="sf-tile-foot">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size={layout === 'list' ? 'md' : 'sm'} />
          <div className="sf-tile-stock">{stock.tone !== 'in' && <span className={`sf-stock sf-stock-${stock.tone}`}>{stock.label}</span>}</div>
          {showAdd && <AddToCartButton product={product} className="sf-btn sf-btn-accent sf-btn-sm sf-btn-block" />}
        </div>
      </div>
    </article>
  )
})
