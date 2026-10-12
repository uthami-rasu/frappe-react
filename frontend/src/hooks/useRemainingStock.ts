import { useAppSelector } from '../app/hooks'
import { MAX_QTY_PER_LINE } from '../features/commerce/commerceSlice'
import type { CatalogProduct } from '../types/catalog'

/** How many more of a product fit in the cart, given ERPNext stock and the per-line limit. */
export function useRemainingStock(product: Pick<CatalogProduct, 'id' | 'stock'>) {
  const inCart = useAppSelector((state) => state.commerce.cart.reduce((sum, line) => (line.productId === product.id ? sum + line.quantity : sum), 0))
  const limit = product.stock === null ? MAX_QTY_PER_LINE : Math.min(product.stock, MAX_QTY_PER_LINE)
  return { inCart, remaining: Math.max(0, limit - inCart) }
}
