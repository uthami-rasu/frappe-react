import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { toggleWishlist } from '../../features/commerce/commerceSlice'
import type { CatalogProduct } from '../../types/catalog'

type WishlistButtonProps = { product: Pick<CatalogProduct, 'id' | 'name'>; className?: string; size?: number; withLabel?: boolean }

/**
 * Heart toggle. Each button subscribes to its own product only, so saving one product doesn't
 * re-render every card. Logged-in changes sync to ERPNext and roll back on failure (app/listeners.ts).
 */
export function WishlistButton({ product, className = 'sf-wish', size = 17, withLabel = false }: WishlistButtonProps) {
  const dispatch = useAppDispatch()
  const saved = useAppSelector((state) => state.commerce.wishlist.includes(product.id))

  const toggle = () => {
    dispatch(toggleWishlist(product.id))
    if (saved) toast.info('Removed from your wishlist', { description: product.name })
    else toast.success('Saved to your wishlist', { description: product.name, action: { label: 'View', onClick: () => { window.location.hash = '#wishlist' } } })
  }

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : `${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} wishlist`}
      title={saved ? 'Saved to wishlist' : 'Save to wishlist'}
    >
      <Heart size={size} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {withLabel && <span>{saved ? 'Saved' : 'Save to wishlist'}</span>}
    </button>
  )
}
