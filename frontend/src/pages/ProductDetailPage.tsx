import { BadgePercent, ChevronLeft, ChevronRight, Lock, PackageSearch, RotateCcw, Share2, Store, Truck, ZoomIn } from 'lucide-react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { buildHash } from '../app/router'
import { Footer } from '../components/layout/Footer'
import { OfferCode, OfferExpiry } from '../components/offers/OfferParts'
import { offerTerms } from '../features/offers/offerText'
import { AddToCartButton } from '../components/product/AddToCartButton'
import { useRemainingStock } from '../hooks/useRemainingStock'
import { ProductRail } from '../components/product/ProductRail'
import { WishlistButton } from '../components/product/WishlistButton'
import { ReviewsSection } from '../components/reviews/ReviewsSection'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { EmptyState, Skeleton } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { Price } from '../components/ui/Price'
import { Rating } from '../components/ui/Stars'
import { StockStatus } from '../components/ui/StockStatus'
import { categoryTrail } from '../features/catalog/catalogQuery'
import { useGetActiveOffersQuery, useGetProductDetailsQuery, useGetRelatedProductsQuery } from '../features/api/storeApi'
import { addToCart, productViewed } from '../features/commerce/commerceSlice'
import { useStorefrontConfig } from '../hooks/useCartQuote'
import { useCatalog } from '../hooks/useCatalog'
import type { CatalogProduct } from '../types/catalog'

type ProductDetailPageProps = { product: CatalogProduct; products: CatalogProduct[] }

function deliveryDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Gallery({ product, images }: { product: CatalogProduct; images: string[] }) {
  const [index, setIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [origin, setOrigin] = useState<string | null>(null)
  const current = images[Math.min(index, images.length - 1)] ?? product.image
  const step = (direction: number) => setIndex((value) => (value + direction + images.length) % images.length)

  const onMove = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setOrigin(`${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`)
  }

  return (
    <div className={`grid gap-3 md:items-start ${images.length > 1 ? 'md:grid-cols-[64px_1fr]' : ''}`}>
      {images.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col" role="group" aria-label="Product images">
          {images.map((image, imageIndex) => (
            <button
              key={image}
              type="button"
              onClick={() => setIndex(imageIndex)}
              onMouseEnter={() => setIndex(imageIndex)}
              aria-label={`Show image ${imageIndex + 1} of ${images.length}`}
              aria-pressed={imageIndex === index}
              className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f3eee4] ${imageIndex === index ? 'border-[var(--sf-accent)]' : 'border-transparent hover:border-[var(--sf-line-strong)]'}`}
            >
              <img src={image} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="relative order-1 md:order-2">
        <button
          type="button"
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[var(--sf-radius-lg)] bg-[#f3eee4]"
          onMouseMove={onMove}
          onMouseLeave={() => setOrigin(null)}
          onClick={() => setZoomOpen(true)}
          aria-label={`Enlarge image of ${product.name}`}
        >
          <img
            src={current}
            alt={product.name}
            width={800}
            height={800}
            fetchPriority="high"
            className="size-full object-cover transition-transform duration-200 motion-reduce:transition-none"
            style={origin ? { transform: 'scale(1.9)', transformOrigin: origin } : undefined}
          />
          <span className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow group-hover:flex"><ZoomIn size={13} /> Click to enlarge</span>
        </button>
        <div className="absolute right-3 top-3"><WishlistButton product={product} /></div>
        {images.length > 1 && (
          <>
            <button type="button" className="sf-icon-btn absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 md:hidden" onClick={() => step(-1)} aria-label="Previous image"><ChevronLeft size={18} /></button>
            <button type="button" className="sf-icon-btn absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 md:hidden" onClick={() => step(1)} aria-label="Next image"><ChevronRight size={18} /></button>
          </>
        )}
      </div>
      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title={product.name} variant="dialog">
        <div className="relative bg-[#f3eee4]">
          <img src={current} alt={product.name} className="max-h-[78vh] w-full object-contain" />
          {images.length > 1 && (
            <>
              <button type="button" className="sf-icon-btn absolute left-2 top-1/2 -translate-y-1/2 bg-white/90" onClick={() => step(-1)} aria-label="Previous image"><ChevronLeft size={20} /></button>
              <button type="button" className="sf-icon-btn absolute right-2 top-1/2 -translate-y-1/2 bg-white/90" onClick={() => step(1)} aria-label="Next image"><ChevronRight size={20} /></button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

function ProductOffers({ product }: { product: CatalogProduct }) {
  const { data: offers = [] } = useGetActiveOffersQuery()
  const matching = offers.filter((offer) => offer.placement === 'Product Page' && (offer.itemCode === product.id || offer.itemGroups.includes(product.category)))
  if (!matching.length) return null
  return (
    <div className="grid gap-2" aria-label="Offers for this product">
      {matching.map((offer) => (
        <div key={offer.id} className="rounded-xl border border-[var(--sf-line)] bg-[var(--sf-surface-alt)] p-3.5">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold"><BadgePercent size={16} className="text-[var(--sf-deal)]" /> {offer.title}{offer.discount && <span className="sf-badge sf-badge-deal">{offer.discount}</span>}</p>
          {offer.description && <p className="mt-1 text-[13px] text-[var(--sf-ink-soft)]">{offer.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {offer.couponCode && <span className="rounded-lg bg-[#173f32] p-0.5"><OfferCode code={offer.couponCode} /></span>}
            <span className="sf-countdown-on-light"><OfferExpiry expiresAt={offer.expiresAt} /></span>
            {offerTerms(offer) && <span className="sf-hint">{offerTerms(offer)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function BuyBox({ product }: { product: CatalogProduct }) {
  const dispatch = useAppDispatch()
  const config = useStorefrontConfig()
  const { remaining, inCart } = useRemainingStock(product)
  const [quantity, setQuantity] = useState(1)
  const options = Array.from({ length: Math.max(1, Math.min(remaining, 10)) }, (_, index) => index + 1)
  const freeShipping = config?.shippingOptions.find((option) => option.amount === 0 && option.id !== 'pickup')
  const fastest = config?.shippingOptions.filter((option) => option.amount > 0).sort((a, b) => a.amount - b.amount)[0]

  const buyNow = () => {
    if (quantity > remaining) return
    dispatch(addToCart({ productId: product.id, quantity, weight: product.size }))
    window.location.hash = '#checkout'
  }

  return (
    <aside className="sf-card grid gap-4 p-5 lg:sticky lg:top-[150px]" aria-label="Buy this product">
      <Price price={product.price} compareAtPrice={product.compareAtPrice} size="md" />
      {config && product.inStock && (
        <div className="grid gap-1.5 text-sm">
          <p className="flex items-start gap-2"><Truck size={17} className="mt-0.5 shrink-0 text-[var(--sf-brand)]" />
            <span>{freeShipping ? <b>{freeShipping.label}.</b> : null} Delivery by <b>{deliveryDate(config.deliveryDays)}</b></span>
          </p>
          {fastest && <p className="sf-hint pl-6">{fastest.label} available at checkout (+₹{fastest.amount})</p>}
        </div>
      )}
      <StockStatus product={product} />
      {inCart > 0 && <p className="sf-hint">{inCart} already in your cart</p>}
      {product.inStock && remaining > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Quantity</span>
          <select className="sf-select" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
            {options.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      )}
      <AddToCartButton product={product} quantity={quantity} />
      {product.inStock && remaining > 0 && <button type="button" className="sf-btn sf-btn-primary sf-btn-block" onClick={buyNow}>Buy now</button>}
      <WishlistButton product={product} withLabel className="sf-btn sf-btn-outline sf-btn-block sf-wish-label" size={16} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-[var(--sf-line)] pt-4 text-[13px]">
        <dt className="text-[var(--sf-muted)]">Ships from</dt><dd className="flex items-center gap-1.5"><Store size={13} /> {config?.storeName ?? 'Bossco'}</dd>
        <dt className="text-[var(--sf-muted)]">Payment</dt><dd className="flex items-center gap-1.5"><Lock size={13} /> Secure checkout</dd>
        <dt className="text-[var(--sf-muted)]">SKU</dt><dd>{product.id}</dd>
      </dl>
    </aside>
  )
}

export function ProductNotFound() {
  return (
    <main className="sf-page">
      <div className="sf-container py-16">
        <EmptyState icon={<PackageSearch size={24} />} title="This product isn’t available" action={<a className="sf-btn sf-btn-primary sf-btn-sm" href="#honey">Browse all products</a>}>
          It may have sold out for the season or been removed from the store.
        </EmptyState>
      </div>
      <Footer />
    </main>
  )
}

export function ProductDetailPage({ product, products }: ProductDetailPageProps) {
  const dispatch = useAppDispatch()
  const { categories } = useCatalog()
  const recentlyViewed = useAppSelector((state) => state.commerce.recentlyViewed)
  const { data: details, isLoading: detailsLoading } = useGetProductDetailsQuery(product.id)
  const { data: related, isLoading: relatedLoading } = useGetRelatedProductsQuery(product.id)
  const byId = useMemo(() => new Map(products.map((item) => [item.id, item])), [products])
  const pick = (ids: string[] | undefined) => (ids ?? []).map((id) => byId.get(id)).filter((item): item is CatalogProduct => Boolean(item))

  // remember the product (most recent first) once the page is open
  useEffect(() => {
    dispatch(productViewed(product.id))
    document.title = `${product.name} · Bossco`
    return () => { document.title = 'Bossco' }
  }, [dispatch, product.id, product.name])

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied')
      }
    } catch {
      // share sheet dismissed
    }
  }

  const trail = categoryTrail(categories, product.category)
  const images = details?.images.length ? details.images : [product.image]
  const recent = pick(recentlyViewed.filter((id) => id !== product.id)).slice(0, 10)
  const signInHref = `#login/product/${product.slug}`

  return (
    <main className="sf-page" id="product-detail">
      <div className="sf-container pb-16 pt-5">
        <Breadcrumbs
          className="mb-5"
          items={[
            { label: 'Home', href: '#home' },
            { label: 'All products', href: '#honey' },
            ...trail.map((name) => ({ label: name, href: buildHash('honey', { category: name }) })),
            { label: product.name },
          ]}
        />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_300px] lg:gap-10" aria-label="Product overview">
          {detailsLoading ? <Skeleton className="aspect-square w-full rounded-[22px]" /> : <Gallery product={product} images={images} />}

          <div className="grid content-start gap-4">
            <a href={buildHash('honey', { category: product.category })} className="sf-link text-sm">{product.category}</a>
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-[2.1rem] font-bold leading-[1.05] tracking-[-.015em] sm:text-[2.6rem]">{product.name}</h1>
              <button type="button" className="sf-icon-btn shrink-0" onClick={share} aria-label="Share this product"><Share2 size={18} /></button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="#reviews" onClick={(event) => { event.preventDefault(); document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }) }} className="hover:underline">
                <Rating rating={product.rating} reviews={product.reviews} size={16} />
              </a>
              {product.sold > 0 && <span className="sf-hint">{product.sold}+ ordered in the last 90 days</span>}
            </div>
            {product.badge && <span className="sf-badge sf-badge-brand w-fit">{product.badge}</span>}
            <hr className="border-[var(--sf-line)]" />
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            <ProductOffers product={product} />
            {product.size && (
              <fieldset>
                <legend className="sf-label mb-2">Size: <span className="font-normal">{product.size}</span></legend>
                <span className="sf-chip is-active" aria-current="true">{product.size}</span>
              </fieldset>
            )}
            {product.subtitle && <p className="text-[15px] leading-7 text-[var(--sf-ink-soft)]">{product.subtitle}</p>}
            {details && details.specs.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                {details.specs.slice(0, 5).map((spec) => <div key={spec.label} className="contents"><dt className="font-bold">{spec.label}</dt><dd className="text-[var(--sf-ink-soft)]">{spec.value}</dd></div>)}
              </dl>
            )}
            <div className="grid gap-2 rounded-xl border border-[var(--sf-line)] p-4 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-2"><Truck size={17} className="text-[var(--sf-brand)]" /> Freshly packed after you order</p>
              <p className="flex items-center gap-2"><RotateCcw size={17} className="text-[var(--sf-brand)]" /> Problem with an order? <a className="sf-link" href="#contact">Contact us</a></p>
            </div>
          </div>

          <BuyBox product={product} />
        </section>

        <ProductRail id="bought-together" title="Frequently bought together" eyebrow="From real orders" products={pick(related?.boughtTogether)} />

        <section className="mt-6 grid gap-8 border-t border-[var(--sf-line)] pt-10 lg:grid-cols-2" aria-labelledby="details-title">
          <div>
            <h2 id="details-title" className="sf-section-title !text-[1.9rem]">Product description</h2>
            {detailsLoading ? (
              <div className="mt-4 grid gap-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
            ) : details?.description ? (
              // sanitised by Frappe (bossco.storefront.get_product_details)
              <div className="prose-sm mt-4 max-w-none text-[15px] leading-7 text-[var(--sf-ink-soft)] [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3" dangerouslySetInnerHTML={{ __html: details.description }} />
            ) : (
              <p className="mt-4 text-[15px] leading-7 text-[var(--sf-ink-soft)]">{product.subtitle || 'No further description yet.'}</p>
            )}
          </div>
          {details && details.specs.length > 0 && (
            <div>
              <h2 className="sf-section-title !text-[1.9rem]">Specifications</h2>
              <table className="mt-4 w-full overflow-hidden rounded-xl text-sm">
                <tbody>
                  {details.specs.map((spec) => (
                    <tr key={spec.label} className="border-b border-[var(--sf-line)] last:border-0">
                      <th scope="row" className="w-2/5 bg-[var(--sf-surface-alt)] px-4 py-3 text-left font-semibold">{spec.label}</th>
                      <td className="px-4 py-3 text-[var(--sf-ink-soft)]">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-12 border-t border-[var(--sf-line)] pt-10">
          <ReviewsSection product={product} signInHref={signInHref} />
        </div>

        <div className="mt-6 border-t border-[var(--sf-line)]">
          <ProductRail id="similar" title="Similar items you might like" eyebrow="Curated for you" products={pick(related?.similar)} isLoading={relatedLoading} viewAllHref={buildHash('honey', { category: product.category })} />
          <ProductRail id="recently-viewed" title="Your browsing history" eyebrow="Recently viewed" products={recent} />
        </div>
      </div>
      <Footer />
    </main>
  )
}
