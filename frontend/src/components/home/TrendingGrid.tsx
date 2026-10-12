import type { TrendingProduct } from '../../types/product'
import { TrendingCard } from './TrendingCard'

export function TrendingGrid({ products }: { products: TrendingProduct[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-2 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <TrendingCard key={product.id} product={product} />
      ))}
    </div>
  )
}
