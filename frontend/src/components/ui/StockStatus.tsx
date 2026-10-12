import type { CatalogProduct } from '../../types/catalog'
import { stockState } from '../../utils/product'

export function StockStatus({ product }: { product: Pick<CatalogProduct, 'inStock' | 'stock'> }) {
  const { tone, label } = stockState(product)
  return <span className={`sf-stock sf-stock-${tone}`}>{label}</span>
}
