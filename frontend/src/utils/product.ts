import type { CatalogProduct } from '../types/catalog'

export const LOW_STOCK = 10

export const productHref = (product: Pick<CatalogProduct, 'slug'>) => `#product/${product.slug}`

/** Availability from ERPNext stock (actual minus reserved); non-stock items are always in stock. */
export function stockState(product: Pick<CatalogProduct, 'inStock' | 'stock'>) {
  if (!product.inStock) return { tone: 'out', label: 'Currently unavailable' } as const
  if (product.stock !== null && product.stock <= LOW_STOCK) return { tone: 'low', label: `Only ${product.stock} left in stock` } as const
  return { tone: 'in', label: 'In stock' } as const
}
