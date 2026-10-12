import { Check, ShoppingCart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAppDispatch } from '../../app/hooks'
import { addToCart, MAX_QTY_PER_LINE } from '../../features/commerce/commerceSlice'
import { useRemainingStock } from '../../hooks/useRemainingStock'
import { openCartDrawer, pulseCart } from '../../features/ui/uiSlice'
import type { CatalogProduct } from '../../types/catalog'

type AddToCartButtonProps = {
  product: Pick<CatalogProduct, 'id' | 'name' | 'size' | 'inStock' | 'stock'>
  quantity?: number
  className?: string
  label?: string
  // open the mini cart afterwards (default) or just confirm in place
  openDrawer?: boolean
}

export function AddToCartButton({ product, quantity = 1, className = 'sf-btn sf-btn-accent sf-btn-block', label = 'Add to cart', openDrawer = true }: AddToCartButtonProps) {
  const dispatch = useAppDispatch()
  const { inCart, remaining } = useRemainingStock(product)
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle')
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const add = () => {
    if (quantity > remaining) {
      toast.error(remaining ? `You can add ${remaining} more` : 'No more available', {
        description: inCart ? `${inCart} already in your cart · ${product.stock ?? MAX_QTY_PER_LINE} available` : undefined,
      })
      return
    }
    // the cart lives in the browser (and is saved to the account when logged in), so this can't fail;
    // prices and stock are checked again by ERPNext at checkout
    dispatch(addToCart({ productId: product.id, quantity, weight: product.size }))
    dispatch(pulseCart())
    setState('adding')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('added'), 250)
    window.setTimeout(() => setState('idle'), 1800)
    if (openDrawer) dispatch(openCartDrawer(product.id))
    else toast.success('Added to cart', { description: `${quantity} × ${product.name}` })
  }

  if (!product.inStock) {
    return <button type="button" className={className} disabled>Currently unavailable</button>
  }
  return (
    <button
      type="button"
      className={`${className} ${state === 'added' ? 'is-done' : ''} ${state === 'adding' ? 'is-adding' : ''}`}
      onClick={add}
      aria-label={`${label}: ${product.name}`}
    >
      <span className="sf-add-icon" aria-hidden="true">{state === 'added' ? <Check size={16} strokeWidth={2.6} /> : <ShoppingCart size={16} />}</span>
      {state === 'added' ? 'Added' : label}
    </button>
  )
}
