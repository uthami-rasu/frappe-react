import { toast } from 'sonner'
import { Check, Heart, Lock, Mail, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  addToCart, MAX_QTY_PER_LINE, removeFromCart, setCartQuantity, setShippingMethod, toggleWishlist,
} from '../features/commerce/commerceSlice'
import type { CartLine } from '../features/commerce/commerceSlice'
import type { CatalogProduct } from '../types/catalog'
import { getProduct } from '../features/commerce/pricing'
import { NutDecorations } from '../components/home/NutDecorations'
import { CartTotals } from '../components/cart/CartTotals'
import { CouponField } from '../components/cart/CouponField'
import { ProductRail } from '../components/product/ProductRail'
import { productHref } from '../utils/product'
import { EmptyState } from '../components/ui/Feedback'
import { Price } from '../components/ui/Price'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { StockStatus } from '../components/ui/StockStatus'
import { stockState } from '../utils/product'
import { useCartQuote, useStorefrontConfig } from '../hooks/useCartQuote'
import { formatMoney } from '../utils/money'

type CommerceProps = { products: CatalogProduct[] }

const money = (value: number) => formatMoney(value)

export function Steps({ active }: { active: 1 | 2 | 3 }) {
  const steps = ['Shopping cart', 'Checkout details', 'Order complete']
  return (
    <div className="checkout-steps">
      {steps.map((label, index) => {
        const stepNum = index + 1
        const isDone = active > stepNum
        const isActive = active === stepNum
        let stepClass = ''
        if (isDone) stepClass = 'is-done'
        else if (isActive) stepClass = 'is-active'

        return (
          <div className={stepClass} key={label}>
            <span>{isDone ? <Check size={14} strokeWidth={3} /> : stepNum}</span>
            <b>{label}</b>
          </div>
        )
      })}
    </div>
  )
}

// "Save for later" adds to the wishlist; it never removes an item that is already saved
function useSaveToWishlist() {
  const dispatch = useAppDispatch()
  const wishlist = useAppSelector((state) => state.commerce.wishlist)
  return (id: string) => {
    if (!wishlist.includes(id)) dispatch(toggleWishlist(id))
  }
}

export function CartPage({ products }: CommerceProps) {
  const cart = useAppSelector((state) => state.commerce.cart)
  const recentlyViewed = useAppSelector((state) => state.commerce.recentlyViewed)
  const dispatch = useAppDispatch()
  const setWishlistItem = useSaveToWishlist()
  const shipping = useAppSelector((state) => state.commerce.shippingMethod)
  const config = useStorefrontConfig()
  const { quote, isStale, isError } = useCartQuote()
  const itemCount = cart.reduce((total, line) => total + line.quantity, 0)
  const blocking = quote?.issues.filter((issue) => issue.type !== 'limited_stock') ?? []
  const suggestions = recentlyViewed
    .filter((id) => !cart.some((line) => line.productId === id))
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is CatalogProduct => Boolean(product))

  const saveForLater = (line: CartLine, product: CatalogProduct) => {
    dispatch(removeFromCart(line))
    setWishlistItem(product.id)
    toast.success('Moved to your wishlist', { description: product.name })
  }

  return (
    <main className="commerce-page relative overflow-hidden">
      <NutDecorations />
      <div className="commerce-wrap relative z-10">
        <h1>Cart</h1>
        <Steps active={1} />
        {cart.length === 0 ? (
          <div className="mx-auto mt-10 max-w-xl">
            <EmptyState icon={<ShoppingBag size={26} />} title="Your cart is empty" action={<a href="#honey" className="sf-btn sf-btn-primary">Explore the collection</a>}>
              Add a small-batch favourite to get started. Items you save to your wishlist stay there for later.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 text-left lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="sf-card p-5 sm:p-6" aria-labelledby="cart-lines-title">
              <div className="flex items-end justify-between border-b border-[var(--sf-line)] pb-3">
                <h2 id="cart-lines-title" className="text-xl font-bold">Shopping cart</h2>
                <span className="sf-hint">Price</span>
              </div>
              <ul>
                {cart.map((line) => {
                  const product = getProduct(products, line)
                  if (!product) return null
                  const issue = quote?.issues.find((item) => item.itemCode === line.productId)
                  const max = product.stock === null ? MAX_QTY_PER_LINE : Math.min(product.stock, MAX_QTY_PER_LINE)
                  return (
                    <li key={`${line.productId}-${line.weight}`} className="grid grid-cols-[88px_1fr] gap-4 border-b border-[var(--sf-line)] py-5 last:border-0 sm:grid-cols-[120px_1fr_auto]">
                      <a href={productHref(product)} className="block overflow-hidden rounded-xl bg-[#f3eee4]" tabIndex={-1} aria-hidden="true">
                        <img src={product.image} alt="" width={120} height={120} className="aspect-square w-full object-cover" loading="lazy" />
                      </a>
                      <div className="grid content-start gap-1.5">
                        <a href={productHref(product)} className="text-[15px] font-semibold leading-snug hover:underline">{product.name}</a>
                        <StockStatus product={product} />
                        {line.weight && <span className="sf-hint">Size: {line.weight}</span>}
                        {issue && (
                          <p className="sf-error" role="alert">
                            {issue.message}
                            {issue.type === 'limited_stock' && issue.available ? (
                              <button type="button" className="sf-link ml-2" onClick={() => dispatch(setCartQuantity({ productId: line.productId, weight: line.weight, quantity: issue.available! }))}>Update to {issue.available}</button>
                            ) : null}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <QuantityStepper
                            value={line.quantity}
                            max={max}
                            label={product.name}
                            onChange={(quantity) => dispatch(setCartQuantity({ productId: line.productId, weight: line.weight, quantity }))}
                            onRemove={() => dispatch(removeFromCart(line))}
                          />
                          <span className="h-4 w-px bg-[var(--sf-line)]" aria-hidden="true" />
                          <button type="button" className="sf-link text-[13px]" onClick={() => { dispatch(removeFromCart(line)); toast.info('Removed from cart', { description: product.name }) }}>Delete</button>
                          <span className="h-4 w-px bg-[var(--sf-line)]" aria-hidden="true" />
                          <button type="button" className="sf-link text-[13px]" onClick={() => saveForLater(line, product)}>Save for later</button>
                        </div>
                      </div>
                      <div className="col-start-2 sm:col-start-3 sm:text-right">
                        <Price price={product.price * line.quantity} compareAtPrice={product.compareAtPrice ? product.compareAtPrice * line.quantity : null} showSavings={false} />
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 text-right text-base">
                Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}): <b>{quote ? formatMoney(quote.subtotal, quote.currency, 2) : '…'}</b>
              </p>
            </section>

            <aside className="sf-card grid content-start gap-5 p-5 lg:sticky lg:top-[150px]" aria-label="Order summary">
              <fieldset className="grid gap-2">
                <legend className="sf-label mb-1">Delivery</legend>
                {(config?.shippingOptions ?? []).map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${shipping === option.id ? 'border-[var(--sf-brand)] bg-[var(--sf-surface-alt)]' : 'border-[var(--sf-line)]'}`}>
                    <span className="flex items-center gap-2.5">
                      <input type="radio" name="shipping" checked={shipping === option.id} onChange={() => dispatch(setShippingMethod(option.id))} className="accent-[var(--sf-brand)]" />
                      {option.label}
                    </span>
                    <b>{option.amount ? `+${formatMoney(option.amount)}` : 'Free'}</b>
                  </label>
                ))}
              </fieldset>
              <CouponField quote={quote} isChecking={isStale} />
              <CartTotals quote={quote} isLoading={isStale} isError={isError} />
              {blocking.length > 0 && <p className="sf-alert sf-alert-warning text-[13px]">Remove unavailable items to continue.</p>}
              <a
                className={`sf-btn sf-btn-accent sf-btn-block ${blocking.length ? 'pointer-events-none opacity-50' : ''}`}
                href="#checkout"
                aria-disabled={blocking.length > 0}
              >
                Proceed to checkout
              </a>
              <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--sf-muted)]"><Lock size={12} /> Prices and stock are confirmed by our store at checkout</p>
            </aside>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="mt-10 text-left">
            <ProductRail title="Pick up where you left off" eyebrow="Recently viewed" products={suggestions.slice(0, 10)} />
          </div>
        )}
      </div>
      <div className="commerce-bottom-bar" />
    </main>
  )
}

export function OrderCompletePage({ products }: CommerceProps) {
  const lastOrder = useAppSelector((state) => state.commerce.lastOrder)
  if (!lastOrder) return <CartPage products={products} />
  return (
    <main className="commerce-page relative overflow-hidden">
      <NutDecorations />
      <div className="commerce-wrap complete-wrap relative z-10">
        <h1>Complete!</h1>
        <Steps active={3} />
        <section className="order-complete shadow-2xl">
          <p className="text-base text-stone-500 font-medium">Thank you! 🎉</p>
          <h2>Your order has been<br />received</h2>
          <div className="complete-images">
            {lastOrder.lines.map((line) => {
              const product = getProduct(products, line)
              return (
                product && (
                  <span key={`${line.productId}-${line.weight}`}>
                    <img src={product.image} alt={product.name} />
                    <b>{line.quantity}</b>
                  </span>
                )
              )
            })}
          </div>
          <dl>
            <div>
              <dt>Order code:</dt>
              <dd>#{lastOrder.id}</dd>
            </div>
            <div>
              <dt>Date:</dt>
              <dd>{new Date(lastOrder.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</dd>
            </div>
            <div>
              <dt>Total:</dt>
              <dd>{money(lastOrder.total)}</dd>
            </div>
            <div>
              <dt>Payment method:</dt>
              <dd>{lastOrder.paymentMethod}{lastOrder.paid ? ' · Paid' : ''}</dd>
            </div>
          </dl>
          {lastOrder.email && (
            <p className="flex items-center justify-center gap-2 text-sm text-stone-600"><Mail size={15} /> A confirmation is on its way to <b>{lastOrder.email}</b></p>
          )}
          <a href="#account/orders" className="bg-[#D9B27C] hover:bg-[#c9a068] text-white font-bold px-6 py-2.5 rounded-full text-xs transition-colors shadow-md">
            Purchase history
          </a>
        </section>
      </div>
      <div className="commerce-bottom-bar" />
    </main>
  )
}
export function WishlistPage({ products }: CommerceProps) {
  const wishlist = useAppSelector((state) => state.commerce.wishlist)
  const cart = useAppSelector((state) => state.commerce.cart)
  const dispatch = useAppDispatch()

  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const wishedProducts = wishlist
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is CatalogProduct => Boolean(p))

  const categories = ['All', ...Array.from(new Set(wishedProducts.map((p) => p.category)))]

  const filteredProducts = wishedProducts.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const cartTotal = cart.reduce((sum, line) => {
    const product = getProduct(products, line)
    return sum + (product ? product.price * line.quantity : 0)
  }, 0)
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  const addAllToCart = () => {
    const available = filteredProducts.filter((p) => p.inStock && !cart.some((line) => line.productId === p.id))
    available.forEach((p) => dispatch(addToCart({ productId: p.id, quantity: 1, weight: p.size })))
    if (available.length) toast.success(`${available.length} item${available.length > 1 ? 's' : ''} added to cart 🍯`)
    else toast.info('Everything available is already in your cart')
  }

  return (
    <main className="commerce-page wishlist-page relative min-h-screen bg-[#f7f4ef] dark:bg-[#0d0d0d] overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-60 -left-60 size-[800px] rounded-full bg-amber-300/20 dark:bg-amber-500/8 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 -right-60 size-[600px] rounded-full bg-emerald-300/15 dark:bg-emerald-600/8 blur-[110px]" />

      {/* ── STICKY HEADER BAR ── */}
      <div className="sticky top-0 z-30 border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-[#0d0d0d]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow-lg shadow-amber-300/40">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-black text-[#173f32] dark:text-stone-100 leading-none">
                My Vault
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {wishedProducts.length} saved item{wishedProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search pill */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vault…"
                className="h-9 w-48 rounded-full border border-stone-200/80 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900 pl-3.5 pr-8 text-xs font-semibold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">✕</button>
              )}
            </div>

            {/* Cart chip */}
            {cartCount > 0 && (
              <a href="#cart" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#173f32] hover:bg-[#1e5040] text-white text-xs font-bold shadow-lg shadow-[#173f32]/30 transition-all hover:scale-105">
                <ShoppingBag size={13} className="text-amber-300" />
                <span>{money(cartTotal)}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 py-8">

        {/* ── CATEGORY FILTER ROW ── */}
        {wishedProducts.length > 0 && (
          <div className="mb-7 flex flex-wrap items-center gap-2.5">
            {categories.map((cat) => {
              const count = cat === 'All' ? wishedProducts.length : wishedProducts.filter((p) => p.category === cat).length
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-200 ${
                    isActive
                      ? 'bg-[#173f32] text-amber-300 border-transparent shadow-lg shadow-[#173f32]/20 scale-105'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-800 hover:border-amber-400/60 hover:text-amber-700 dark:hover:text-amber-400'
                  }`}
                >
                  {cat}
                  <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-amber-400/25 text-amber-200' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}

            <div className="ml-auto flex gap-2">
              {filteredProducts.length > 0 && (
                <button
                  type="button"
                  onClick={addAllToCart}
                  className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black shadow-lg shadow-amber-300/30 transition-all hover:scale-105"
                >
                  <ShoppingBag size={13} /> Add All ({filteredProducts.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {filteredProducts.length === 0 && (
          <div className="py-28 text-center">
            <div className="mx-auto mb-8 size-28 rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 grid place-items-center shadow-2xl shadow-amber-200/50 dark:shadow-amber-900/30 rotate-12">
              <Heart size={52} className="text-white fill-white -rotate-12" />
            </div>
            <h2 className="font-display text-4xl font-black text-[#173f32] dark:text-stone-100">Nothing saved yet</h2>
            <p className="mt-4 text-stone-500 dark:text-stone-400 text-base max-w-md mx-auto leading-relaxed">
              Tap the ♡ heart on any honey jar while browsing to save it to your personal vault.
            </p>
            <a
              href="#honey"
              className="mt-8 inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-[#173f32] text-white font-black text-sm shadow-xl shadow-[#173f32]/30 hover:bg-[#1e5040] transition hover:scale-105"
            >
              Explore Honey Room →
            </a>
          </div>
        )}

        {/* ── PRODUCT GRID — uniform equal-size cards ── */}
        {filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((product) => {
              const cartLine = cart.find((l) => l.productId === product.id)
              const cartQty = cartLine ? cartLine.quantity : 0

              return (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-white/60 dark:border-stone-800/80 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-stone-900"
                >
                  {/* Full-bleed image with overlay — fixed aspect ratio on all cards */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Gradient scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Category pill top-left */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </span>

                    {/* Remove button top-right */}
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(toggleWishlist(product.id))
                        toast.info(`${product.name} removed from vault`)
                      }}
                      className="absolute top-3 right-3 size-8 grid place-items-center rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white/80 hover:bg-rose-500/80 hover:text-white hover:border-transparent transition-all duration-200 hover:scale-110"
                      aria-label="Remove from vault"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Bottom text overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-3">
                      <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">{product.size}</p>
                      <h3 className="text-white text-sm font-display font-black leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  {/* Price + CTA strip */}
                  <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                    <div>
                      <p className="font-display text-lg font-black text-[#173f32] dark:text-amber-400 leading-none">
                        {money(product.price)}
                      </p>
                      <p className={`mt-0.5 text-[10px] font-bold sf-stock-${stockState(product).tone}`}>
                        {stockState(product).label}
                      </p>
                    </div>

                    {!product.inStock ? (
                      <span className="text-xs font-bold text-stone-400">Sold out</span>
                    ) : cartQty === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(addToCart({ productId: product.id, quantity: 1, weight: product.size }))
                          toast.success('Added! 🛒', { description: product.name })
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#173f32] hover:bg-[#1e5040] text-white text-xs font-black shadow-md shadow-[#173f32]/20 transition-all hover:scale-105"
                      >
                        <Plus size={12} strokeWidth={3} /> Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1.5">
                        <button
                          type="button"
                          aria-label={`Remove one ${product.name}`}
                          onClick={() => {
                            if (cartQty <= 1) dispatch(removeFromCart({ productId: product.id, weight: product.size }))
                            else dispatch(setCartQuantity({ productId: product.id, weight: product.size, quantity: cartQty - 1 }))
                          }}
                          className="size-6 grid place-items-center rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200 transition"
                        >
                          <Minus size={11} strokeWidth={2.5} />
                        </button>
                        <span className="w-5 text-center text-sm font-black text-stone-900 dark:text-stone-100">{cartQty}</span>
                        <button
                          type="button"
                          aria-label={`Add one more ${product.name}`}
                          disabled={product.stock !== null && cartQty >= product.stock}
                          onClick={() => dispatch(setCartQuantity({ productId: product.id, weight: product.size, quantity: cartQty + 1 }))}
                          className="size-6 grid place-items-center rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200 transition"
                        >
                          <Plus size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* ── BOTTOM CTA STRIP ── */}
        {filteredProducts.length > 0 && (
          <div className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f2e22] via-[#173f32] to-[#0f2e22] p-8 sm:p-10 shadow-2xl shadow-[#173f32]/30 relative">
            {/* Subtle texture dots */}
            <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle,_#f59e0b_1px,_transparent_1px)] bg-[length:24px_24px]" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-amber-400/70 text-[11px] uppercase tracking-[0.2em] font-bold mb-2">Ready to checkout?</p>
                <h2 className="font-display text-2xl sm:text-4xl font-black text-white leading-tight">
                  {filteredProducts.length} Jar{filteredProducts.length > 1 ? 's' : ''} waiting in your vault
                </h2>
                <p className="text-white/50 text-sm mt-2">Add everything at once and save time at checkout.</p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={addAllToCart}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm shadow-xl shadow-black/30 transition-all hover:scale-105"
                >
                  <ShoppingBag size={16} /> Add All to Cart
                </button>
                <a
                  href="#cart"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm transition-all"
                >
                  View Cart →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

