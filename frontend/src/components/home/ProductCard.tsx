import { toast } from 'sonner'
import { Check, Heart, Plus } from 'lucide-react'
import { useState } from 'react'
import type { CatalogProduct } from '../../types/catalog'
import { ProductRating } from './ProductRating'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addToCart, toggleWishlist } from '../../features/commerce/commerceSlice'
import { pulseCart } from '../../features/ui/uiSlice'
import { useRemainingStock } from '../../hooks/useRemainingStock'

type ProductCardProps = {
  product: CatalogProduct
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const dispatch = useAppDispatch()
  const productId = product.id
  const isLiked = useAppSelector((state) => state.commerce.wishlist.includes(productId))
  const [isAdded, setIsAdded] = useState(false)
  const { remaining } = useRemainingStock(product)

  return (
    <article className="product-card group relative mx-auto flex w-full flex-col p-2.5" data-reveal style={{ transitionDelay: `${index * 45}ms` }}>
      <div className="product-card-frame relative aspect-[4/3.9] overflow-hidden">
        <a href={`#product/${product.slug}`} tabIndex={-1} aria-hidden="true">
          <img
            className="size-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.07]"
            src={product.image}
            alt=""
            width={340}
            height={330}
            loading="lazy"
            decoding="async"
          />
        </a>
        <span className="product-card-sheen" aria-hidden="true" />
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <button
          className={`product-fav ${isLiked ? 'is-liked' : ''}`}
          onClick={() => {
            dispatch(toggleWishlist(productId))
            if (isLiked) {
              toast.info('Removed from Wishlist', { description: `${product.name} removed.` })
            } else {
              toast.success('Added to Wishlist! ❤️', { description: `${product.name} saved to collection.` })
            }
          }}
          type="button"
          aria-label={`${isLiked ? 'Remove' : 'Add'} ${product.name} ${isLiked ? 'from' : 'to'} wishlist`}
        >
          <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-2.5 pt-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <ProductRating rating={product.rating} reviews={product.reviews} />
          <span className="text-[9px] font-bold uppercase tracking-[.16em] text-stone-400">{product.size}</span>
        </div>

        <h3 className="mt-2.5 font-display text-[17px] font-bold leading-[1.12] tracking-[-.015em] text-[#173f32] dark:text-stone-50">
          <a href={`#product/${product.slug}`} className="hover:underline">{product.name}</a>
        </h3>

        <div className="mt-auto">
          <span className="product-card-rule" />
          <div className="flex items-end justify-between gap-3">
            <p className="product-price"><span>₹</span>{product.price}</p>
            <button
              className={`product-add disabled:cursor-not-allowed disabled:opacity-50 ${isAdded ? 'is-added' : ''}`}
              type="button"
              disabled={!product.inStock || remaining < 1}
              onClick={() => {
                dispatch(addToCart({ productId, quantity: 1, weight: product.size }))
                dispatch(pulseCart())
                setIsAdded(true)
                toast.success('Added to Cart! 🛒', { description: `${product.name} (${product.size}) added to your cart.` })
                window.setTimeout(() => setIsAdded(false), 1600)
              }}
              aria-label={`Add ${product.name} to cart`}
            >
              {isAdded ? <Check size={14} strokeWidth={2.6} /> : <Plus size={14} strokeWidth={2.6} />}
              {!product.inStock ? 'Sold out' : isAdded ? 'Added' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
