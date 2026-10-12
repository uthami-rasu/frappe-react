import { toast } from 'sonner'
import { UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { NutDecorations } from '../components/home/NutDecorations'
import { formatAddress } from '../utils/address'
import { PaymentSection } from '../components/checkout/PaymentSection'
import { useGetAddressesQuery, usePlaceOrderMutation, type PlaceOrderRequest } from '../features/api/storeApi'
import { orderPlaced } from '../features/commerce/commerceSlice'
import { useSession } from '../hooks/useSession'
import type { CatalogProduct, PaymentDetails, PaymentMethod } from '../types/catalog'
import { formatMoney } from '../utils/money'
import { getProduct, shippingCostFor } from '../features/commerce/pricing'
import { CartPage, Steps } from './CommercePages'

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

  if (!cart.length) return <CartPage products={products} />

  const subtotal = cart.reduce((total, line) => total + (getProduct(products, line)?.price ?? 0) * line.quantity, 0)
  const shippingCost = shippingCostFor(shipping)
  const finalTotal = subtotal + shippingCost
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
      contact: { first_name: field('first_name'), last_name: field('last_name'), email: field('email'), phone: field('phone') },
    }
    if (user && selectedAddress !== NEW_ADDRESS) request.address_name = selectedAddress
    else request.address = { address_line1: field('address_line1'), city: field('city'), state: field('state'), pincode: field('pincode'), country: field('country') }

    try {
      const order = await submitOrder(request).unwrap()
      dispatch(orderPlaced(order))
      toast.success(order.paid ? 'Payment successful! 🎉' : 'Order placed successfully! 🎉', { description: 'Thank you for shopping with BossCo.' })
      window.location.hash = '#order-complete'
    } catch (error) {
      toast.error(paymentMethod === 'cod' ? 'Could not place your order' : 'Payment failed', {
        description: typeof error === 'string' ? error : 'Please check your connection and try again.',
      })
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
                    <input required name="phone" type="tel" autoComplete="tel" placeholder="Phone number" defaultValue={user.phone} />
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

            <PaymentSection method={paymentMethod} onChange={setPaymentMethod} />

            <button className="place-order font-bold text-white shadow-md hover:brightness-105 transition-all disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isPlacingOrder}>
              {isPlacingOrder ? (paymentMethod === 'cod' ? 'Placing order…' : 'Processing payment…') : paymentMethod === 'cod' ? 'Place order' : `Pay ${formatMoney(finalTotal)}`}
            </button>
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
            <dl>
              <div>
                <dt>Shipping</dt>
                <dd className="font-bold text-emerald-700">{shippingCost ? formatMoney(shippingCost) : 'Free'}</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatMoney(finalTotal)}</dd>
              </div>
            </dl>
          </aside>
        </form>
      </div>
      <div className="commerce-bottom-bar" />
    </main>
  )
}
