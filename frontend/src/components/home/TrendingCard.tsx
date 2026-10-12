import { Plus } from 'lucide-react'
import type { TrendingProduct } from '../../types/product'

type TrendingCardProps = {
  product: TrendingProduct
}

export function TrendingCard({ product }: TrendingCardProps) {
  const isWide = product.layout === 'wide'

  return (
    <article className={isWide ? 'sm:col-span-2' : ''}>
      <div className="group relative flex h-[285px] items-center justify-center overflow-hidden rounded-[24px] border border-[#ece4d9] bg-[#f8f3ea] p-7 transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(55,36,17,.09)] dark:bg-stone-900 sm:h-[310px]" data-reveal>
        <img
          className={`max-h-full object-contain transition duration-500 group-hover:scale-105 ${
            isWide ? 'w-[62%] max-w-[310px]' : 'w-[90%] max-w-[235px]'
          }`}
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        <button
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-[#dfa66c] text-white shadow-sm transition hover:scale-105 hover:bg-[#c98c50]"
          type="button"
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus aria-hidden="true" size={22} strokeWidth={1.8} />
        </button>
      </div>
      <div className="pt-3 text-left">
        <h3 className="text-lg font-medium text-stone-950 dark:text-stone-50">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">₹{product.price}</p>
      </div>
    </article>
  )
}
