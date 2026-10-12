import { toast } from 'sonner'
import { AlertTriangle, Lock, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { NutDecorations } from '../components/home/NutDecorations'
import { CartTotals } from '../components/cart/CartTotals'
import { CouponField } from '../components/cart/CouponField'
import { formatAddress } from '../utils/address'
import { PaymentSection } from '../components/checkout/PaymentSection'
import { useGetAddressesQuery, usePlaceOrderMutation, type PlaceOrderRequest } from '../features/api/storeApi'
import { orderPlaced, setShippingMethod } from '../features/commerce/commerceSlice'
import { useCartQuote, useStorefrontConfig } from '../hooks/useCartQuote'
import { useSession } from '../hooks/useSession'
import type { CatalogProduct, PaymentDetails, PaymentMethod } from '../types/catalog'
import { formatMoney } from '../utils/money'
import { getProduct } from '../features/commerce/pricing'
import { CartPage, Steps } from './CommercePages'

// One key per checkout attempt; resubmitting (double click, retry after a timeout) returns the
// same order instead of placing a second one (bossco.api.place_order).
function newCheckoutKey() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const NEW_ADDRESS = '__new__'

function AddressFields() {
  return (
    <div className="form-grid">
      <label className="span-2">
        STREET ADDRESS *
        <input required name="address_line1" autoComplete="street-address" placeholder="Street Address" />
      </label>
      <label className="span-2">
        COUNTRY *
        <select required name="country" autoComplete="country-name" defaultValue="India">
          <option value="India">India</option>
          <option value="United States">United States</option>
        </select>
      </label>
      <label className="span-2">
        TOWN / CITY *
        <input required name="city" autoComplete="address-level2" placeholder="Town / City" />
      </label>
      <label>
        STATE *
        <input required name="state" autoComplete="address-level1" placeholder="State" />
      </label>
      <label>
        PIN / ZIP CODE *
        <input required name="pincode" autoComplete="postal-code" placeholder="PIN code" />
      </label>
    </div>
  )
}

export function CheckoutPage({ products }: { products: CatalogProduct[] }) {
  const cart = useAppSelector((state) => state.commerce.cart)
  const shipping = useAppSelector((state) => state.commerce.shippingMethod)
  const dispatch = useAppDispatch()
  const { user } = useSession()
  const { data: addresses = [] } = useGetAddressesQuery(undefined, { skip: !user })
  const [chosenAddress, setChosenAddress] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [submitOrder, { isLoading: isPlacingOrder }] = usePlaceOrderMutation()
  const [checkoutKey] = useState(newCheckoutKey)
  const [orderError, setOrderError] = useState<string | null>(null)
  const couponCode = useAppSelector((state) => state.commerce.couponCode)
  const config = useStorefrontConfig()
  const { quote, isStale, isError } = useCartQuote()

  if (!cart.length) return <CartPage products={products} />

  const blocking = quote?.issues ?? []
  const canPay = Boolean(quote && !quote.error && !blocking.length && !isStale)
  const defaultAddress = addresses.find((address) => address.is_shipping_address) ?? addresses[0]
  const selectedAddress = chosenAddress ?? defaultAddress?.name ?? NEW_ADDRESS

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()

    const payment: PaymentDetails =
      paymentMethod === 'card'
        ? { method: 'card', name: field('card_name'), card_number: field('card_number'), expiry: field('card_expiry'), cvc: field('card_cvc') }
        : paymentMethod === 'upi'
          ? { method: 'upi', upi_id: field('upi_id') }
          : { method: 'cod' }

    const request: PlaceOrderRequest = {
      items: cart.map((line) => ({ item_code: line.productId, qty: line.quantity })),
      shipping_method: shipping,
      payment,
      checkout_key: checkoutKey,
      coupon_code: quote?.coupon.applied ? couponCode : undefined,
      contact: { first_name: field('first_name'), last_name: field('last_name'), email: field('email'), phone: field('phone') },
    }
    if (user && selectedAddress !== NEW_ADDRESS) request.address_name = selectedAddress
    else request.address = { address_line1: field('address_line1'), city: field('city'), state: field('state'), pincode: field('pincode'), country: field('country') }

    setOrderError(null)
    try {
      const order = await submitOrder(request).unwrap()
      dispatch(orderPlaced(order))
      toast.success(order.paid ? 'Payment successful! 🎉' : 'Order placed successfully! 🎉', { description: 'Thank you for shopping with BossCo.' })
      window.location.hash = '#order-complete'
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Please check your connection and try again.'
      setOrderError(message)
      toast.error(paymentMethod === 'cod' ? 'Could not place your order' : 'Payment failed', { description: message })
    }
  }

  return (
    <main className="commerce-page relative overflow-hidden">
      <NutDecorations />
      <div className="commerce-wrap checkout-wrap relative z-10">
        <h1>Check Out</h1>
        <Steps active={2} />
        <form className="checkout-layout" onSubmit={handleSubmit}>
          <div className="checkout-forms">
            {!user && (
              <a href="#login/checkout" className="flex items-center gap-3 rounded-lg border border-[#d9c6a4] bg-[#fbf6ec] px-4 py-3 text-sm text-stone-700 hover:border-[#c9a068]">
                <UserRound size={18} className="text-[#a36932]" />
                <span><b>Have an account?</b> Sign in to use saved addresses and track this order.</span>
              </a>
            )}

            <section className="shadow-md">
              <h2>Contact Information</h2>
              {user ? (
                <div className="form-grid">
                  <p className="span-2 text-sm text-stone-700">
                    Ordering as <b>{user.fullName}</b> ({user.email})
                  </p>
                  <label className="span-2">
                    PHONE NUMBER
                    <input required name="phone" type="tel" autoComplete="tel" placeholder="Phone number" key={addresses.length} defaultValue={user.phone || addresses.find((address) => address.phone)?.phone || ''} />
                  </label>
                </div>
              ) : (
                <div className="form-grid">
                  <label>
                    FIRST NAME *
                    <input required name="first_name" autoComplete="given-name" placeholder="First name" />
                  </label>
                  <label>
                    LAST NAME
                    <input name="last_name" autoComplete="family-name" placeholder="Last name" />
                  </label>
                  <label className="span-2">
                    PHONE NUMBER *
                    <input required name="phone" type="tel" autoComplete="tel" placeholder="Phone number" />
                  </label>
                  <label className="span-2">
                    EMAIL ADDRESS *
                    <input required name="email" type="email" autoComplete="email" placeholder="Your Email" />
                  </label>
                </div>
              )}
            </section>

            <section className="shadow-md">
              <h2>Shipping Address</h2>
              {user && addresses.length > 0 && (
                <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label="Delivery address">
                  {addresses.map((address) => (
                    <label key={address.name} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition ${selectedAddress === address.name ? 'border-[#527d49] bg-[#f3f7f0]' : 'border-[#d3cfc7] hover:border-[#a9b7a2]'}`}>
                      <input className="mt-1" type="radio" name="saved_address" checked={selectedAddress === address.name} onChange={() => setChosenAddress(address.name)} />
                      <span className="text-stone-700">{formatAddress(address)}</span>
                    </label>
                  ))}
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${selectedAddress === NEW_ADDRESS ? 'border-[#527d49] bg-[#f3f7f0]' : 'border-[#d3cfc7] hover:border-[#a9b7a2]'}`}>
                    <input type="radio" name="saved_address" checked={selectedAddress === NEW_ADDRESS} onChange={() => setChosenAddress(NEW_ADDRESS)} />
                    <b className="text-stone-800">Deliver to a new address</b>
                  </label>
                </div>
              )}
              {selectedAddress === NEW_ADDRESS && <AddressFields />}
              {user && selectedAddress === NEW_ADDRESS && <p className="mt-3 text-xs text-stone-500">This address will be saved to your account.</p>}
            </section>

            <section className="shadow-md">
              <h2>Delivery</h2>
              <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label="Delivery method">
                {(config?.shippingOptions ?? []).map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition ${shipping === option.id ? 'border-[#527d49] bg-[#f3f7f0]' : 'border-[#d3cfc7] hover:border-[#a9b7a2]'}`}>
                    <span className="flex items-center gap-3"><input type="radio" name="shipping_method" checked={shipping === option.id} onChange={() => dispatch(setShippingMethod(option.id))} /> <b className="text-stone-800">{option.label}</b></span>
                    <span className="font-semibold text-stone-700">{option.amount ? `+${formatMoney(option.amount)}` : 'Free'}</span>
                  </label>
                ))}
              </div>
            </section>

            <PaymentSection method={paymentMethod} onChange={setPaymentMethod} />

            {orderError && (
              <p className="sf-alert sf-alert-error" role="alert"><AlertTriangle size={17} className="mt-0.5 shrink-0" /> {orderError}</p>
            )}
            {blocking.length > 0 && (
              <p className="sf-alert sf-alert-warning" role="alert"><AlertTriangle size={17} className="mt-0.5 shrink-0" /> Some items changed: {blocking.map((issue) => `${getProduct(products, { productId: issue.itemCode, quantity: 0, weight: '' })?.name ?? issue.itemCode} — ${issue.message}`).join('; ')}. <a href="#cart" className="sf-link">Review your cart</a></p>
            )}
            <button className="place-order font-bold text-white shadow-md hover:brightness-105 transition-all disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isPlacingOrder || !canPay} aria-describedby="checkout-total">
              {isPlacingOrder
                ? (paymentMethod === 'cod' ? 'Placing order…' : 'Processing payment…')
                : !quote ? 'Calculating total…'
                : paymentMethod === 'cod' ? `Place order · ${formatMoney(quote.total, quote.currency, 2)}` : `Pay ${formatMoney(quote.total, quote.currency, 2)}`}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500"><Lock size={12} /> Prices, discounts and stock are checked again by our store when you place the order.</p>
          </div>

          <aside className="order-summary shadow-lg">
            <h2>Order summary</h2>
            {cart.map((line) => {
              const product = getProduct(products, line)
              if (!product) return null
              return (
                <div className="summary-line" key={`${line.productId}-${line.weight}`}>
                  <img src={product.image} alt="" />
                  <span>
                    <b>{product.name}</b>
                    {line.weight && <small>Weight: {line.weight}</small>}
                  </span>
                  <div className="summary-qty-box flex items-center gap-1.5 border border-stone-300 rounded px-2 py-0.5 text-xs font-bold">
                    <span>×</span> <span>{line.quantity}</span>
                  </div>
                  <strong>{formatMoney(product.price * line.quantity)}</strong>
                </div>
              )
            })}
            <div className="mt-4 grid gap-4 border-t border-stone-200 pt-4 text-left" id="checkout-total">
              <CouponField quote={quote} isChecking={isStale} />
              <CartTotals quote={quote} isLoading={isStale} isError={isError} />
            </div>
          </aside>
        </form>
      </div>
      <div className="commerce-bottom-bar" />
    </main>
  )
}
