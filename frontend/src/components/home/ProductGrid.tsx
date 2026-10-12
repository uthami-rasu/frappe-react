import type { CatalogProduct } from '../../types/catalog'
import { ProductCard } from './ProductCard'

type ProductGridProps = {
  products: CatalogProduct[]
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="mx-auto grid max-w-[1340px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}
