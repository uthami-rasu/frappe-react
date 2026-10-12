import { toast } from 'sonner'
import { useMemo, useState } from 'react'
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Heart, ImagePlus, Minus, PackageCheck, Plus, RotateCcw,
  Share2, ShoppingBag, Star, ThumbsUp, Truck,
} from 'lucide-react'
import { Footer } from '../components/layout/Footer'
import type { CatalogProduct } from '../types/catalog'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { addToCart, toggleWishlist } from '../features/commerce/commerceSlice'

type ProductDetailPageProps = { product: CatalogProduct; products: CatalogProduct[] }

const benefits = [
  'Raw and gently filtered to retain its naturally occurring aroma and character.',
  'Never overheated, preserving the flavour of the original seasonal harvest.',
  'Collected in limited batches from traceable forest and meadow locations.',
  'Contains no artificial flavouring, added colour or refined sugar.',
  'Packed in glass to protect freshness and reduce unnecessary plastic.',
]

const productDetails = [
  'Natural honey may crystallise over time; place the jar in warm water to liquefy.',
  'Not suitable for infants under 12 months of age.',
]

const moreDetails = [
  'Store sealed in a cool, dry place away from direct sunlight.',
  'Colour and flavour naturally vary from one harvest to the next.',
  'Packed and quality checked in small batches.',
  'Batch reference: BOS-HNY-2026.',
]

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function DetailRating({ product }: { product: CatalogProduct }) {
  return <span className="detail-rating"><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill="currentColor" />)}</span><b>{product.rating}</b><small>({product.reviews} reviews)</small></span>
}

function SimilarProduct({ product }: { product: CatalogProduct }) {
  const dispatch = useAppDispatch()
  return (
    <article className="similar-product">
      <a className="similar-product-image" href={`#product/${product.slug}`}><img src={product.image} alt={product.name} /></a>
      <span className="similar-category">{product.category}</span>
      <button type="button" onClick={() => dispatch(addToCart({ productId: product.id, quantity: 1, weight: product.size }))} aria-label={`Add ${product.name} to cart`}><Plus size={16} /></button>
      <a href={`#product/${product.slug}`}><strong>{product.name}</strong><small>{product.size}</small><b>{money(product.price)}</b></a>
    </article>
  )
}

const reviews = [
  { initials: 'AT', name: 'Anita Thomas', date: '3 days ago', title: 'Beautiful flavour and freshness', content: 'The aroma is wonderfully floral and the honey tastes genuinely fresh. The glass jar and careful packaging also make it feel very premium.', rating: 5 },
  { initials: 'RK', name: 'Rohan Kapoor', date: '2 weeks ago', title: 'A lovely everyday honey', content: 'Smooth, balanced and not overwhelmingly sweet. It has become our favourite for breakfast and evening tea.', rating: 5 },
]

function ReviewsPanel({ product, onSubmit }: { product: CatalogProduct; onSubmit: () => void }) {
  const [reviewRating, setReviewRating] = useState(5)
  return (
    <div className="reviews-panel">
      <h2>Customer Feedback</h2>
      <div className="review-summary">
        <div className="review-score"><strong>{product.rating}</strong><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}</span><small>Product rating</small></div>
        <div className="rating-bars">{[70, 15, 10, 3, 2].map((percent, index) => <div key={percent}><span className="bar-track"><i style={{ width: `${percent}%` }} /></span><span className="bar-stars">{Array.from({ length: 5 - index }, (_, star) => <Star key={star} size={10} fill="currentColor" />)}</span><b>{percent}%</b></div>)}</div>
      </div>
      <h2 className="review-list-heading">Reviews</h2>
      <div className="customer-reviews">{reviews.map((review) => <article className="customer-review" key={review.name}><span className="review-avatar">{review.initials}</span><div><header><b>{review.name}</b><small>{review.date}</small></header><span className="review-stars">{Array.from({ length: review.rating }, (_, index) => <Star key={index} size={11} fill="currentColor" />)}</span><h3>{review.title}</h3><p>{review.content}</p><button type="button"><ThumbsUp size={11} /> Helpful</button></div></article>)}</div>
      <button className="view-reviews" type="button">View all reviews</button>
      <form className="review-form" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <h2>Write a Review</h2>
        <label>What is it like to use this product?</label>
        <div className="review-rating-input" aria-label={`Selected rating: ${reviewRating} stars`}>{[1, 2, 3, 4, 5].map((rating) => <button type="button" aria-label={`${rating} stars`} key={rating} onClick={() => setReviewRating(rating)}><Star size={18} fill={rating <= reviewRating ? 'currentColor' : 'none'} /></button>)}</div>
        <label htmlFor="review-title">Review title</label><input id="review-title" required placeholder="A great small-batch honey" />
        <label htmlFor="review-content">Review content</label><div className="review-textarea"><textarea id="review-content" required placeholder="What did you enjoy about this honey?" /><ImagePlus size={19} /></div>
        <button className="submit-review" type="submit">Submit review</button>
      </form>
    </div>
  )
}

export function ProductDetailPage({ product, products }: ProductDetailPageProps) {
  const dispatch = useAppDispatch()
  const wished = useAppSelector((state) => state.commerce.wishlist.includes(product.id))
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedWeight, setSelectedWeight] = useState(product.size)
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<'description' | 'reviews'>('description')
  const gallery = useMemo(() => [product.image, ...products.filter((item) => item.id !== product.id).slice(0, 3).map((item) => item.image)], [product, products])
  const similar = products.filter((item) => item.id !== product.id).slice(0, 4)
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0
  // One pack size per Item; offer more sizes by adding them as separate Items (or variants)
  const weights = product.size ? [product.size] : []
  const availability = !product.inStock ? 'Out of stock' : product.stock !== null && product.stock <= 10 ? `Only ${product.stock} left` : 'In stock'

  return (
    <main className="product-detail-page" id="product-detail">
      <div className="mx-auto max-w-[1280px] px-5 pb-20 pt-8 sm:px-8 lg:px-12 lg:pt-12">
        <a className="product-back" href="#honey"><ArrowLeft size={16} /> Back to products</a>
        <nav className="product-breadcrumb" aria-label="Breadcrumb"><a href="#home">Home</a><span>/</span><a href="#honey">Products</a><span>/</span><a href="#honey">Honey varieties</a><span>/</span><b>{product.name}</b></nav>

        <section className="product-detail-top">
          <div className="product-gallery">
            <div className="product-main-image"><img src={gallery[selectedImage]} alt={product.name} /><button className={wished ? 'is-active' : ''} type="button" onClick={() => dispatch(toggleWishlist(product.id))} aria-label="Save to wishlist"><Heart size={18} fill={wished ? 'currentColor' : 'none'} /></button></div>
            <div className="product-thumbnails"><button type="button" aria-label="Previous image" onClick={() => setSelectedImage((selectedImage - 1 + gallery.length) % gallery.length)}><ChevronLeft size={16} /></button>{gallery.map((image, index) => <button className={selectedImage === index ? 'is-active' : ''} type="button" key={`${image}-${index}`} onClick={() => setSelectedImage(index)}><img src={image} alt={`${product.name} view ${index + 1}`} /></button>)}<button type="button" aria-label="Next image" onClick={() => setSelectedImage((selectedImage + 1) % gallery.length)}><ChevronRight size={16} /></button></div>
          </div>

          <div className="product-purchase-panel">
            <div className="flex items-start justify-between gap-4"><div><span className="product-overline">{product.category}</span><h1>{product.name}</h1><p>{product.origin ? `Sourced from the deep forests of ${product.origin}, unfiltered and completely natural.` : product.subtitle}</p></div><div className="flex gap-1"><button className="detail-icon-button" type="button" onClick={() => dispatch(toggleWishlist(product.id))} aria-label="Wishlist"><Heart size={15} fill={wished ? 'currentColor' : 'none'} /></button><button className="detail-icon-button" type="button" aria-label="Share"><Share2 size={15} /></button></div></div>
            <div className="product-price-row"><div><strong>{money(product.price)}</strong>{product.compareAtPrice && <small>{money(product.compareAtPrice)}</small>}</div>{discount > 0 && <span>{discount}% off</span>}<DetailRating product={product} /></div>
            <dl className="product-meta"><div><dt>SKU</dt><dd>{product.id.toUpperCase()}</dd></div><div><dt>Category</dt><dd><a href="#honey">{product.category}</a></dd></div><div><dt>Availability</dt><dd className={product.inStock ? 'text-[#4f7f46]' : 'text-[#b94738]'}>{availability}</dd></div></dl>
            {weights.length > 0 && <fieldset className="product-weight"><legend>Weight</legend><div>{weights.map((weight) => <label key={weight}><input type="radio" name="weight" value={weight} checked={selectedWeight === weight} onChange={() => setSelectedWeight(weight)} /><span>{weight}</span></label>)}</div></fieldset>}
            <div className="product-buy-row"><div className="quantity-control"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div><button className="detail-add-cart disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={!product.inStock} onClick={() => { dispatch(addToCart({ productId: product.id, quantity, weight: selectedWeight })); toast.success('Added to cart!', { description: `${quantity} × ${product.name} (${selectedWeight}) added to your bag.` }) }}><ShoppingBag size={15} /> Add to cart</button></div>
            <div className="product-service-list"><div><Truck size={19} /><span><b>Free delivery</b><small>Free over ₹999 · Check delivery availability</small></span></div><div><RotateCcw size={19} /><span><b>Return delivery</b><small>Free 30-day delivery return · Details</small></span></div></div>
          </div>
        </section>

        <section className="product-information">
          <div className="product-tabs"><button className={tab === 'description' ? 'is-active' : ''} type="button" onClick={() => setTab('description')}>Description</button><button className={tab === 'reviews' ? 'is-active' : ''} type="button" onClick={() => setTab('reviews')}>Reviews ({product.reviews})</button></div>
          {tab === 'description' ? <div className="product-copy"><h2>Product Description</h2><p>Gathered in a limited seasonal harvest, {product.name} carries the distinctive character of {product.origin}. Its layered amber sweetness and natural floral finish make it beautiful in tea, over warm toast, paired with cheese or enjoyed directly from the spoon. Each jar is gently filtered and packed without artificial additives.</p><h3>Benefits</h3><ul>{benefits.map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul><h3>Product Details</h3><ul>{productDetails.map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul><h3>More Details</h3><ul>{moreDetails.map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul></div> : <ReviewsPanel product={product} onSubmit={() => toast.success('Thank you for your review!', { description: 'Your feedback has been submitted successfully.' })} />}
        </section>

        <section className="similar-section"><div className="similar-heading"><div><span><PackageCheck size={14} /> Curated for you</span><h2>Similar Items You Might Also Like</h2></div><a href="#honey">View all honey <ChevronRight size={14} /></a></div><div className="similar-products">{similar.map((item) => <SimilarProduct key={item.id} product={item} />)}</div></section>
      </div>
      <Footer />
    </main>
  )
}
