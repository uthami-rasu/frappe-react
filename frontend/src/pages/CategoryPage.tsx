import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Check, ChevronDown, Filter, Grid2X2, Heart, Info, LayoutList,
  Leaf, MapPin, Minus, PackageCheck, Search, ShieldCheck, ShoppingBag, SlidersHorizontal,
  Sparkles, Star, Truck, X,
} from 'lucide-react'
import { Footer } from '../components/layout/Footer'
import { uniqueCategories } from '../hooks/useCatalog'
import type { CatalogSort, CatalogProduct } from '../types/catalog'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { addToCart, toggleWishlist } from '../features/commerce/commerceSlice'
import { StatsBand } from '../components/home/StatsBand'
import { NewsletterSection } from '../components/home/NewsletterSection'
import categoryHeroBg from '../assets/category/image copy.webp'

type CategoryPageProps = { products: CatalogProduct[] }
type ViewMode = 'grid' | 'list'
type FilterSnapshot = {
  search: string
  category: string
  maxPrice: number | null
  selectedSizes: string[]
  minRating: number
}

const ALL_CATEGORIES = 'All products'

// maxPrice null = no price cap
const defaultFilters: FilterSnapshot = {
  search: '',
  category: ALL_CATEGORIES,
  maxPrice: null,
  selectedSizes: [],
  minRating: 0,
}

const badgeClass: Record<string, string> = {
  Bestseller: 'bg-[#b27a10] text-white',
  'Pure comb': 'bg-[#4f8245] text-white',
  'Limited harvest': 'bg-[#f7d4cd] text-[#8b342a]',
  'New season': 'bg-[#dbe8c9] text-[#385b2e]',
}
const defaultBadgeClass = 'bg-[#173f32] text-white'

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="catalog-tooltip group/tip relative inline-grid">
      {children}
      <span className="pointer-events-none absolute bottom-[calc(100%+.55rem)] left-1/2 z-30 w-max max-w-48 -translate-x-1/2 rounded-lg bg-[#173f32] px-2.5 py-1.5 text-center text-[10px] font-medium text-white opacity-0 shadow-xl transition duration-200 group-hover/tip:translate-y-[-2px] group-hover/tip:opacity-100 group-focus-within/tip:opacity-100" role="tooltip">{label}</span>
    </span>
  )
}

function Rating({ rating, reviews }: Pick<CatalogProduct, 'rating' | 'reviews'>) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${rating} out of 5 stars, ${reviews} reviews`}>
      <span className="flex text-[#d6941a]" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill="currentColor" strokeWidth={1.5} />)}
      </span>
      <span className="text-[11px] font-semibold text-stone-700">{rating}</span>
      <span className="text-[10px] text-stone-400">({reviews})</span>
    </div>
  )
}

function ProductCard({ product, view, wished, onWish, onAdd }: {
  product: CatalogProduct; view: ViewMode; wished: boolean; onWish: () => void; onAdd: () => void
}) {
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0
  return (
    <article className={`honey-product-card group ${view === 'list' ? 'honey-product-list' : ''}`}>
      <div className="honey-product-media">
        {product.badge && <span className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.1em] ${badgeClass[product.badge] ?? defaultBadgeClass}`}>{product.badge}</span>}
        <Tooltip label={wished ? 'Remove from wishlist' : 'Save to wishlist'}>
          <button className={`product-wish ${wished ? 'is-wished' : ''}`} type="button" onClick={onWish} aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}>
            <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
          </button>
        </Tooltip>
        <a className="block h-full" href={`#product/${product.slug}`} aria-label={`View ${product.name}`}><img src={product.image} alt={product.origin ? `${product.name} from ${product.origin}` : product.name} loading="lazy" /></a>
        {product.origin && <span className="product-origin"><MapPin size={11} /> {product.origin}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><Rating rating={product.rating} reviews={product.reviews} /><span className="text-[10px] font-medium text-stone-400">{product.size}</span></div>
        <h3 className="mt-2 font-display text-[1.35rem] font-bold leading-tight text-[#1d3028] transition-colors group-hover:text-[#9b6426]"><a href={`#product/${product.slug}`}>{product.name}</a></h3>
        <p className="mt-2 line-clamp-2 text-[11px] leading-[1.65] text-stone-500">{product.subtitle}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div><strong className="text-xl font-semibold text-[#4f7f46]">{money(product.price)}</strong>{product.compareAtPrice && <><span className="ml-2 text-[10px] text-stone-400 line-through">{money(product.compareAtPrice)}</span><span className="ml-2 text-[9px] font-bold text-[#b94738]">{discount}% OFF</span></>}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="product-add disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={onAdd} disabled={!product.inStock}><ShoppingBag size={13} /> {product.inStock ? 'Add to cart' : 'Sold out'}</button>
          <Tooltip label={`Buy ${product.name} now`}><a className="product-details" href={`#product/${product.slug}`}>Buy now</a></Tooltip>
        </div>
      </div>
    </article>
  )
}

function FilterPanel({ idPrefix, categories, sizes, priceFloor, priceCeiling, search, setSearch, category, setCategory, maxPrice, setMaxPrice, selectedSizes, toggleSize, minRating, setMinRating, clear, onApply, isLoading }: {
  idPrefix: string
  categories: string[]; sizes: string[]; priceFloor: number; priceCeiling: number
  search: string; setSearch: (value: string) => void
  category: string; setCategory: (value: string) => void; maxPrice: number | null; setMaxPrice: (value: number) => void
  selectedSizes: string[]; toggleSize: (size: string) => void; minRating: number; setMinRating: (value: number) => void; clear: () => void
  onApply: () => void; isLoading: boolean
}) {
  const searchId = `${idPrefix}-honey-search`
  const priceCap = maxPrice ?? priceCeiling
  return (
    <div className="catalog-filter-inner">
      <div className="filter-panel-heading"><div><SlidersHorizontal size={16} /> Filters</div><button className="filter-clear" type="button" onClick={clear}>Clear all</button></div>
      <div className="filter-group">
        <label className="filter-label" htmlFor={searchId}>Search collection</label>
        <div className="filter-search"><Search size={14} /><input id={searchId} placeholder="Wildflower, comb..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <p className="filter-help">Results update after you select <strong>Apply filters</strong>.</p>
      </div>
      <div className="filter-group">
        <div className="flex items-center justify-between"><span className="filter-label">Price range</span><span className="rounded-md bg-[#f2f4e8] px-2 py-1 text-[10px] font-semibold text-[#4f7f46]">Up to {money(priceCap)}</span></div>
        <input className="price-slider mt-4 w-full" type="range" min={priceFloor} max={priceCeiling} step="100" value={priceCap} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Maximum price" />
        <div className="filter-price-labels"><span>{money(priceFloor)}</span><span>{money(priceCeiling)}</span></div>
      </div>
      <fieldset className="filter-group"><legend className="filter-label">Category</legend><div className="mt-3 space-y-2.5">{categories.map((item) => <label className="filter-check" key={item}><input type="radio" name="category" checked={category === item} onChange={() => setCategory(item)} /><span className="fake-check">{category === item && <Check size={10} />}</span>{item}</label>)}</div></fieldset>
      <fieldset className="filter-group"><legend className="filter-label">Customer rating</legend><div className="mt-3 space-y-2.5">{[4.8, 4.7, 4.5].map((rating) => <label className="filter-check" key={rating}><input type="radio" name="rating" checked={minRating === rating} onChange={() => setMinRating(rating)} /><span className="fake-radio" /> <span className="flex items-center gap-1.5 text-[#d6941a]"><Star size={12} fill="currentColor" /> <b className="text-xs font-semibold text-stone-700">{rating} & up</b></span></label>)}</div></fieldset>
      <fieldset className="filter-group"><legend className="filter-label">Jar size</legend><div className="mt-3 flex flex-wrap gap-2">{sizes.map((size) => <button className={`size-filter ${selectedSizes.includes(size) ? 'is-active' : ''}`} type="button" key={size} onClick={() => toggleSize(size)}>{size}</button>)}</div></fieldset>
      <div className="filter-note"><span><Leaf size={14} /> Nothing unnecessary</span>Every jar is raw, traceable and packed without artificial flavouring.</div>
      <button className="filter-apply" type="button" onClick={onApply} disabled={isLoading}>
        {isLoading ? <><span className="filter-spinner" /> Applying filters…</> : <><SlidersHorizontal size={13} /> Apply filters</>}
      </button>
    </div>
  )
}

function CatalogLoading() {
  return (
    <div className="catalog-loading" role="status" aria-live="polite" aria-label="Loading filtered honey products">
      <div className="catalog-loading-message"><span className="loading-honey-drop" /><div><strong>Finding your perfect harvest</strong><small>Applying your filters…</small></div></div>
      <div className="loading-card-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <div className="loading-product-card" key={index}><span className="loading-media" /><span className="loading-line loading-line-short" /><span className="loading-line" /><span className="loading-line loading-line-mid" /><span className="loading-button" /></div>)}
      </div>
    </div>
  )
}

export function CategoryPage({ products }: CategoryPageProps) {
  const [sort, setSort] = useState<CatalogSort>('featured')
  const [search, setSearch] = useState(defaultFilters.search)
  const [view, setView] = useState<ViewMode>('grid')
  const [category, setCategory] = useState<string>(defaultFilters.category)
  const [maxPrice, setMaxPrice] = useState(defaultFilters.maxPrice)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(defaultFilters.selectedSizes)
  const [minRating, setMinRating] = useState(defaultFilters.minRating)
  const [appliedFilters, setAppliedFilters] = useState<FilterSnapshot>(defaultFilters)
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useAppDispatch()
  const wished = useAppSelector((state) => state.commerce.wishlist)
  const [filterOpen, setFilterOpen] = useState(false)
  const applyTimer = useRef<number | null>(null)
  const categories = useMemo(() => [ALL_CATEGORIES, ...uniqueCategories(products)], [products])
  const sizes = useMemo(() => Array.from(new Set(products.map((product) => product.size).filter(Boolean))), [products])
  const priceFloor = useMemo(() => Math.floor(Math.min(...products.map((product) => product.price), 0) / 100) * 100, [products])
  const priceCeiling = useMemo(() => Math.max(Math.ceil(Math.max(...products.map((product) => product.price), 0) / 100) * 100, priceFloor + 100), [products, priceFloor])

  useEffect(() => () => {
    if (applyTimer.current) window.clearTimeout(applyTimer.current)
  }, [])

  const visible = useMemo(() => {
    const query = appliedFilters.search.trim().toLocaleLowerCase()
    const result = products.filter((product) => (!query || `${product.name} ${product.subtitle} ${product.origin} ${product.category}`.toLocaleLowerCase().includes(query)) && (appliedFilters.category === ALL_CATEGORIES || product.category === appliedFilters.category) && (appliedFilters.maxPrice === null || product.price <= appliedFilters.maxPrice) && product.rating >= appliedFilters.minRating && (!appliedFilters.selectedSizes.length || appliedFilters.selectedSizes.includes(product.size)))
    return [...result].sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'rating' ? b.rating - a.rating : sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : Number(Boolean(b.badge)) - Number(Boolean(a.badge)))
  }, [products, appliedFilters, sort])
  const clear = () => {
    if (applyTimer.current) window.clearTimeout(applyTimer.current)
    applyTimer.current = null
    setSearch(defaultFilters.search)
    setCategory(defaultFilters.category)
    setMaxPrice(defaultFilters.maxPrice)
    setSelectedSizes(defaultFilters.selectedSizes)
    setMinRating(defaultFilters.minRating)
    setAppliedFilters(defaultFilters)
    setIsLoading(false)
  }
  const toggleSize = (size: string) => setSelectedSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size])
  const applyFilters = () => {
    if (applyTimer.current) window.clearTimeout(applyTimer.current)
    setIsLoading(true)
    applyTimer.current = window.setTimeout(() => {
      setAppliedFilters({ search, category, maxPrice, selectedSizes: [...selectedSizes], minRating })
      setIsLoading(false)
      setFilterOpen(false)
      applyTimer.current = null
    }, 700)
  }
  const resetResults = () => {
    clear()
  }

  return (
    <main id="home">
      <section className="category-hero">
        <div className="category-hero-image" style={{ backgroundImage: `url("${categoryHeroBg}")` }} aria-hidden="true" />
        <div className="category-hero-glow" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-[430px] max-w-[1440px] items-center px-5 py-16 sm:px-8 lg:px-14">
          <div className="max-w-[660px] category-hero-copy">
            <nav className="mb-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#eed6aa]" aria-label="Breadcrumb"><a className="hover:text-white" href="#home">Home</a><span>/</span><a className="hover:text-white" href="#catalog">Collection</a><span>/</span><span className="text-white">Honey</span></nav>
            <span className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-[#e8bd71]"><Sparkles size={13} /> Small-batch · Raw · Traceable</span>
            <h1 className="font-display text-[3.2rem] font-bold leading-[.94] tracking-[-.025em] text-white sm:text-[4.8rem]">Nature’s gold,<br /><em className="font-semibold text-[#efc87e]">bottled slowly.</em></h1>
            <p className="mt-6 max-w-[570px] text-sm leading-7 text-white/75 sm:text-base">Discover rare honey gathered from forest, meadow and mountain bloom — untouched by heat and fully traceable to its native landscape.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-[10px] font-semibold uppercase tracking-[.12em] text-white/75"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#e8bd71]" /> Lab tested</span><span className="h-4 w-px bg-white/20" /><span className="flex items-center gap-2"><PackageCheck size={16} className="text-[#e8bd71]" /> Freshly packed</span><span className="h-4 w-px bg-white/20" /><span className="flex items-center gap-2"><Truck size={16} className="text-[#e8bd71]" /> Free over ₹999</span></div>
          </div>
        </div>
        <a className="hero-scroll-cue" href="#catalog" aria-label="Scroll to collection"><span>Explore the harvest</span><ChevronDown size={16} /></a>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-orb catalog-orb-one" aria-hidden="true" /><div className="catalog-orb catalog-orb-two" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><span className="eyebrow flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#a46a2a]">The honey room</span><h2 className="mt-3 font-display text-4xl font-bold text-[#193f32] sm:text-5xl">A harvest for every palate</h2><p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">Single-origin jars and thoughtful pairings, sourced in limited seasonal batches.</p></div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500"><Info size={14} className="text-[#a46a2a]" /> Hover over icons for helpful details</div>
          </div>

          <div className="catalog-toolbar">
            <div><b className="font-display text-xl text-[#244538]">Honey varieties</b><span className="ml-2 text-[11px] text-stone-400">{visible.length} of {products.length} products</span></div>
            <div className="flex items-center gap-2">
              <button className="mobile-filter-button" type="button" onClick={() => setFilterOpen(true)}><Filter size={14} /> Filters</button>
              <label className="sort-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as CatalogSort)}><option value="featured">Featured</option><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select><ChevronDown size={13} /></label>
              <div className="view-switch" aria-label="View mode"><Tooltip label="Grid view"><button className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view" type="button"><Grid2X2 size={15} /></button></Tooltip><Tooltip label="List view"><button className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view" type="button"><LayoutList size={16} /></button></Tooltip></div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[245px_1fr] xl:grid-cols-[265px_1fr]">
            <aside className="catalog-filter"><FilterPanel idPrefix="desktop" {...{ categories, sizes, priceFloor, priceCeiling, search, setSearch, category, setCategory, maxPrice, setMaxPrice, selectedSizes, toggleSize, minRating, setMinRating, clear, onApply: applyFilters, isLoading }} /></aside>
            <div className="catalog-results-shell">
              {isLoading ? <CatalogLoading /> : visible.length ? (
                <div className={`product-catalog-grid ${view === 'list' ? 'is-list' : ''}`}>
                  {visible.map((product) => {
                    const isWished = wished.includes(product.id)
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        view={view}
                        wished={isWished}
                        onWish={() => {
                          dispatch(toggleWishlist(product.id))
                          if (isWished) {
                            toast.info('Removed from Wishlist', { description: `${product.name} removed.` })
                          } else {
                            toast.success('Added to Wishlist! ❤️', { description: `${product.name} saved to collection.` })
                          }
                        }}
                        onAdd={() => {
                          dispatch(addToCart({ productId: product.id, quantity: 1, weight: product.size }))
                          toast.success('Added to Cart! 🛒', { description: `${product.name} (${product.size}) added to your bag.` })
                        }}
                      />
                    )
                  })}
                </div>
              ) : <div className="catalog-empty"><Minus size={24} /><h3>No jars match those filters</h3><p>Try widening your price or removing a size.</p><button type="button" onClick={resetResults}>Reset filters</button></div>}
            </div>
          </div>
        </div>
      </section>

      <StatsBand />
      <NewsletterSection />

      {filterOpen && <div className="filter-drawer-backdrop" role="presentation" onClick={() => setFilterOpen(false)}><aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Product filters" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><b className="font-display text-2xl text-[#193f32]">Refine your harvest</b><button className="icon-button" type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={19} /></button></div><FilterPanel idPrefix="mobile" {...{ categories, sizes, priceFloor, priceCeiling, search, setSearch, category, setCategory, maxPrice, setMaxPrice, selectedSizes, toggleSize, minRating, setMinRating, clear, onApply: applyFilters, isLoading }} /></aside></div>}
      <Footer />
    </main>
  )
}
