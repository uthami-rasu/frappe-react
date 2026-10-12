import { CheckCircle2, ShoppingBag } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { removeFromCart, setCartQuantity } from '../../features/commerce/commerceSlice'
import { closeCartDrawer } from '../../features/ui/uiSlice'
import { useCartQuote } from '../../hooks/useCartQuote'
import { useCatalog } from '../../hooks/useCatalog'
import { formatMoney } from '../../utils/money'
import { productHref } from '../../utils/product'
import { EmptyState } from '../ui/Feedback'
import { Modal } from '../ui/Modal'
import { QuantityStepper } from '../ui/QuantityStepper'
import { CartTotals } from './CartTotals'

/** Mini cart that slides in after "Add to cart". */
export function CartDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.ui.cartDrawerOpen)
  const lastAddedId = useAppSelector((state) => state.ui.lastAddedId)
  const cart = useAppSelector((state) => state.commerce.cart)
  const { products } = useCatalog()
  const { quote, isStale, isError } = useCartQuote({ skip: !open })
  const close = () => dispatch(closeCartDrawer())
  const lastAdded = products.find((product) => product.id === lastAddedId)

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Your cart (${cart.reduce((sum, line) => sum + line.quantity, 0)})`}
      footer={cart.length > 0 && (
        <>
          <CartTotals quote={quote} isLoading={isStale} isError={isError} showShipping={false} />
          <p className="sf-hint">Shipping and coupons are applied at checkout.</p>
          <a href="#checkout" className="sf-btn sf-btn-accent sf-btn-block" onClick={close}>Proceed to checkout</a>
          <a href="#cart" className="sf-btn sf-btn-outline sf-btn-block" onClick={close}>View cart</a>
        </>
      )}
    >
      {lastAdded && cart.some((line) => line.productId === lastAdded.id) && (
        <p className="sf-alert sf-alert-success mb-3" role="status">
          <CheckCircle2 size={18} className="shrink-0" /> <span><b>Added to cart:</b> {lastAdded.name}</span>
        </p>
      )}
      {cart.length === 0 ? (
        <EmptyState icon={<ShoppingBag size={24} />} title="Your cart is empty" action={<a href="#honey" className="sf-btn sf-btn-primary sf-btn-sm" onClick={close}>Start shopping</a>}>
          Browse the collection and add something you love.
        </EmptyState>
      ) : (
        <ul>
          {cart.map((line) => {
            const product = products.find((item) => item.id === line.productId)
            if (!product) return null
            const issue = quote?.issues.find((item) => item.itemCode === line.productId)
            const max = product.stock === null ? 100 : Math.min(product.stock, 100)
            return (
              <li key={`${line.productId}-${line.weight}`} className={`sf-cart-line ${line.productId === lastAddedId ? 'is-new' : ''}`}>
                <img src={product.image} alt="" width={64} height={64} loading="lazy" />
                <div className="min-w-0">
                  <a href={productHref(product)} onClick={close} className="line-clamp-2 text-sm font-semibold hover:underline">{product.name}</a>
                  {line.weight && <p className="sf-hint">{line.weight}</p>}
                  {issue && <p className="sf-error mt-1">{issue.message}</p>}
                  <div className="mt-2">
                    <QuantityStepper
                      value={line.quantity}
                      max={max}
                      label={product.name}
                      onChange={(quantity) => dispatch(setCartQuantity({ productId: line.productId, weight: line.weight, quantity }))}
                      onRemove={() => dispatch(removeFromCart(line))}
                    />
                  </div>
                </div>
                <b className="text-sm tabular-nums">{formatMoney(product.price * line.quantity)}</b>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
