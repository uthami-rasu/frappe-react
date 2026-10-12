import { ChevronDown, ChevronLeft, ChevronRight, Filter, Grid2X2, LayoutList, PackageCheck, SearchX, ShieldCheck, Sparkles, Truck, X } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { preload } from 'react-dom'
import { getLenis } from '../app/lenis'
import { buildHash, navigate, useRoute } from '../app/router'
import { NewsletterSection } from '../components/home/NewsletterSection'
import { StatsBand } from '../components/home/StatsBand'
import { Footer } from '../components/layout/Footer'
import { ProductTile } from '../components/product/ProductTile'
import { Breadcrumbs, type Crumb } from '../components/ui/Breadcrumbs'
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { Stars } from '../components/ui/Stars'
import {
  activeFilterCount, categoryTrail, paginate, parseCatalogParams, priceBands, queryCatalog, SORT_LABELS, toQueryRecord,
  type CatalogListSort, type CatalogParams, type Facets,
} from '../features/catalog/catalogQuery'
import { useStorefrontConfig } from '../hooks/useCartQuote'
import { useCatalog } from '../hooks/useCatalog'
import type { CategoryNode } from '../types/catalog'
import { formatMoney } from '../utils/money'
import categoryHeroBg from '../assets/category/image copy.webp'

type ViewMode = 'grid' | 'list'
const VIEW_KEY = 'bossco:catalog-view'

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-[var(--sf-line)] py-4 last:border-0">
      <legend className="mb-2 float-left w-full text-[13px] font-extrabold uppercase tracking-[.08em] text-[var(--sf-ink)]">{title}</legend>
      <div className="clear-both grid gap-0.5">{children}</div>
    </fieldset>
  )
}

function PriceFilter({ params, facets, onChange }: { params: CatalogParams; facets: Facets; onChange: (patch: Partial<CatalogParams>) => void }) {
  const bands = useMemo(() => priceBands(facets.price.min, facets.price.max), [facets.price.min, facets.price.max])
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (name: string) => (String(form.get(name) ?? '').trim() === '' ? null : Math.max(0, Number(form.get(name))))
    let [min, max] = [value('min'), value('max')]
    if (min !== null && max !== null && min > max) [min, max] = [max, min]
    onChange({ minPrice: min, maxPrice: max })
  }
  const label = (band: { min: number | null; max: number | null }) =>
    band.min === null ? `Under ${formatMoney(band.max!)}` : band.max === null ? `Over ${formatMoney(band.min)}` : `${formatMoney(band.min)} – ${formatMoney(band.max)}`
  return (
    <FilterGroup title="Price">
      {bands.map((band) => {
        const active = params.minPrice === band.min && params.maxPrice === band.max
        return (
          <button key={label(band)} type="button" aria-pressed={active} className={`sf-check text-left ${active ? '!font-bold !text-[var(--sf-ink)]' : ''}`} onClick={() => onChange(active ? { minPrice: null, maxPrice: null } : { minPrice: band.min, maxPrice: band.max })}>
            {label(band)}
          </button>
        )
      })}
      <form className="mt-2 flex items-center gap-2" onSubmit={submit} key={`${params.minPrice}-${params.maxPrice}`}>
        <label className="sf-sr-only" htmlFor="price-min">Minimum price</label>
        <input id="price-min" name="min" type="number" min={0} inputMode="numeric" placeholder="Min" defaultValue={params.minPrice ?? ''} className="sf-input !min-h-[38px] !px-2.5 text-sm" />
        <span aria-hidden="true">–</span>
        <label className="sf-sr-only" htmlFor="price-max">Maximum price</label>
        <input id="price-max" name="max" type="number" min={0} inputMode="numeric" placeholder="Max" defaultValue={params.maxPrice ?? ''} className="sf-input !min-h-[38px] !px-2.5 text-sm" />
        <button type="submit" className="sf-btn sf-btn-outline sf-btn-sm !min-h-[38px] !px-3">Go</button>
      </form>
    </FilterGroup>
  )
}

function CategoryFilter({ categories, params, facets, onChange }: { categories: CategoryNode[]; params: CatalogParams; facets: Facets; onChange: (patch: Partial<CatalogParams>) => void }) {
  return (
    <FilterGroup title="Category">
      <button type="button" aria-pressed={!params.category} className={`sf-check text-left ${!params.category ? '!font-bold !text-[var(--sf-ink)]' : ''}`} onClick={() => onChange({ category: null })}>
        All products
      </button>
      {categories.map((category) => {
        const count = facets.categories.get(category.name) ?? 0
        const active = params.category === category.name
        return (
          <button
            key={category.name}
            type="button"
            aria-pressed={active}
            disabled={!count && !active}
            className={`sf-check text-left ${active ? '!font-bold !text-[var(--sf-ink)]' : ''} ${!count && !active ? 'is-disabled' : ''}`}
            style={{ paddingLeft: `${category.depth * 14}px` }}
            onClick={() => onChange({ category: active ? null : category.name })}
          >
            {category.name}<span className="sf-count">{count}</span>
          </button>
        )
      })}
    </FilterGroup>
  )
}

function FilterPanel({ categories, params, facets, onChange }: { categories: CategoryNode[]; params: CatalogParams; facets: Facets; onChange: (patch: Partial<CatalogParams>) => void }) {
  return (
    <div>
      <CategoryFilter categories={categories} params={params} facets={facets} onChange={onChange} />
      <FilterGroup title="Customer reviews">
        {facets.ratings.map(({ value, count }) => {
          const active = params.rating === value
          return (
            <button key={value} type="button" aria-pressed={active} disabled={!count && !active} className={`sf-check text-left ${!count && !active ? 'is-disabled' : ''} ${active ? '!font-bold !text-[var(--sf-ink)]' : ''}`} onClick={() => onChange({ rating: active ? 0 : value })}>
              <Stars value={value} size={15} /> <span>&amp; up</span><span className="sf-sr-only">{value} stars and up</span><span className="sf-count">{count}</span>
            </button>
          )
        })}
      </FilterGroup>
      <PriceFilter params={params} facets={facets} onChange={onChange} />
      {facets.sizes.length > 0 && (
        <FilterGroup title="Pack size">
          {facets.sizes.map(({ value, count }) => (
            <label key={value} className={`sf-check ${!count && !params.sizes.includes(value) ? 'is-disabled' : ''}`}>
              <input
                type="checkbox"
                checked={params.sizes.includes(value)}
                disabled={!count && !params.sizes.includes(value)}
                onChange={() => onChange({ sizes: params.sizes.includes(value) ? params.sizes.filter((size) => size !== value) : [...params.sizes, value] })}
              />
              {value}<span className="sf-count">{count}</span>
            </label>
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Availability">
        <label className="sf-check">
          <input type="checkbox" checked={params.availability === 'in-stock'} onChange={() => onChange({ availability: params.availability === 'in-stock' ? 'all' : 'in-stock' })} />
          In stock only<span className="sf-count">{facets.inStock}</span>
        </label>
        <label className={`sf-check ${!facets.deals && !params.deals ? 'is-disabled' : ''}`}>
          <input type="checkbox" checked={params.deals} disabled={!facets.deals && !params.deals} onChange={() => onChange({ deals: !params.deals })} />
          Deals &amp; discounts<span className="sf-count">{facets.deals}</span>
        </label>
      </FilterGroup>
    </div>
  )
}

function ActiveFilters({ params, onChange }: { params: CatalogParams; onChange: (patch: Partial<CatalogParams>) => void }) {
  const chips: Array<{ label: string; clear: Partial<CatalogParams> }> = []
  if (params.q) chips.push({ label: `“${params.q}”`, clear: { q: '' } })
  if (params.category) chips.push({ label: params.category, clear: { category: null } })
  if (params.rating) chips.push({ label: `${params.rating}★ & up`, clear: { rating: 0 } })
  if (params.minPrice !== null || params.maxPrice !== null) {
    chips.push({ label: params.maxPrice === null ? `Over ${formatMoney(params.minPrice!)}` : params.minPrice === null ? `Under ${formatMoney(params.maxPrice)}` : `${formatMoney(params.minPrice)} – ${formatMoney(params.maxPrice)}`, clear: { minPrice: null, maxPrice: null } })
  }
  params.sizes.forEach((size) => chips.push({ label: size, clear: { sizes: params.sizes.filter((item) => item !== size) } }))
  if (params.availability === 'in-stock') chips.push({ label: 'In stock', clear: { availability: 'all' } })
  if (params.deals) chips.push({ label: 'Deals', clear: { deals: false } })
  if (!chips.length) return null
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button key={chip.label} type="button" className="sf-chip" onClick={() => onChange(chip.clear)} aria-label={`Remove filter ${chip.label}`}>
          {chip.label} <X size={13} aria-hidden="true" />
        </button>
      ))}
      <button type="button" className="sf-link text-sm" onClick={() => onChange({ q: '', category: null, rating: 0, minPrice: null, maxPrice: null, sizes: [], availability: 'all', deals: false })}>Clear all</button>
    </div>
  )
}

function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  if (pageCount <= 1) return null
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((item) => item === 1 || item === pageCount || Math.abs(item - page) <= 1)
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button type="button" className="sf-btn sf-btn-outline sf-btn-sm" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft size={15} /> Previous</button>
      {pages.map((item, index) => (
        <span key={item} className="flex items-center gap-2">
          {index > 0 && item - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
          <button type="button" className={`sf-chip !min-h-[36px] !min-w-[36px] justify-center ${item === page ? 'is-active' : ''}`} aria-current={item === page ? 'page' : undefined} aria-label={`Page ${item}`} onClick={() => onPage(item)}>{item}</button>
        </span>
      ))}
      <button type="button" className="sf-btn sf-btn-outline sf-btn-sm" disabled={page === pageCount} onClick={() => onPage(page + 1)}>Next <ChevronRight size={15} /></button>
    </nav>
  )
}

export const CategoryPage = memo(function CategoryPage() {
  // the hero background is this page's largest paint
  preload(categoryHeroBg, { as: 'image', fetchPriority: 'high' })
  const route = useRoute()
  const { products, categories, isLoading, isError, refetch } = useCatalog()
  const config = useStorefrontConfig()
  const params = useMemo(() => parseCatalogParams(route.params), [route.params])
  const [view, setView] = useState<ViewMode>(readView)
  const [filterOpen, setFilterOpen] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { results, facets } = useMemo(() => queryCatalog(products, categories, params), [products, categories, params])
  const { items, page, pageCount } = paginate(results, params.page)
  const filterCount = activeFilterCount(params)

  // The filter column is taller than the screen, so after a change made low in it the (now
  // shorter) results can sit above the viewport. Once the new results have rendered, bring
  // them back under the header.
  const scrollAfterUpdate = useRef(false)
  useEffect(() => {
    if (!scrollAfterUpdate.current) return
    scrollAfterUpdate.current = false
    const element = resultsRef.current
    if (!element || element.getBoundingClientRect().top >= 0) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(element, { offset: -150, duration: 0.6 })
    else element.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [params])
  const update = (patch: Partial<CatalogParams>) => {
    const next = { ...params, ...patch, page: patch.page ?? 1 }
    if ('q' in patch && !patch.q && next.sort === 'relevance') next.sort = 'featured'
    scrollAfterUpdate.current = true
    navigate(buildHash(route.path || 'honey', toQueryRecord(next)))
  }
  const goToPage = (target: number) => {
    update({ page: target })
    resultsRef.current?.scrollIntoView({ block: 'start' })
  }
  const changeView = (mode: ViewMode) => {
    setView(mode)
    try {
      localStorage.setItem(VIEW_KEY, mode)
    } catch {
      // per-browser preference only
    }
  }

  // keep the page title meaningful for history, bookmarks and screen readers
  useEffect(() => {
    const title = params.q ? `Results for “${params.q}”` : params.category ?? 'All products'
    document.title = `${title} · Bossco`
    return () => { document.title = 'Bossco' }
  }, [params.q, params.category])

  const trail = categoryTrail(categories, params.category)
  const crumbs: Crumb[] = [{ label: 'Home', href: '#home' }, { label: 'All products', href: '#honey' }, ...trail.map((name) => ({ label: name, href: buildHash('honey', { category: name }) }))]
  if (params.q) crumbs.push({ label: `Search: “${params.q}”` })
  const heading = params.q ? `Results for “${params.q}”` : params.category ?? 'The full collection'
  const freeShipping = config?.shippingOptions.some((option) => option.amount === 0)
  const first = (page - 1) * 12 + 1

  return (
    <main id="home">
      <section className="category-hero">
        <div className="category-hero-image" style={{ backgroundImage: `url("${categoryHeroBg}")` }} aria-hidden="true" />
        <div className="category-hero-glow" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-[300px] max-w-[1440px] items-center px-5 py-12 sm:px-8 lg:min-h-[360px] lg:px-14">
          <div className="category-hero-copy max-w-[660px]">
            <Breadcrumbs items={crumbs} className="mb-5 [&_.sf-breadcrumbs]:text-[#eed6aa] [&_[aria-current]]:!text-white [&_a:hover]:!text-white" />
            <span className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-[#e8bd71]"><Sparkles size={13} /> Small-batch · Natural · Traceable</span>
            <h1 className="font-display text-[2.8rem] font-bold leading-[.95] tracking-[-.025em] text-white sm:text-[4.2rem]">{heading}</h1>
            <p className="mt-5 max-w-[570px] text-sm leading-7 text-white/75 sm:text-base">Nuts, sun-dried fruit and raw honey, freshly packed after you order and priced live from our store.</p>
            <div className="mt-7 flex flex-wrap items-center gap-5 text-[10px] font-semibold uppercase tracking-[.12em] text-white/75">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#e8bd71]" /> Quality tested</span>
              <span className="h-4 w-px bg-white/20" />
              <span className="flex items-center gap-2"><PackageCheck size={16} className="text-[#e8bd71]" /> Freshly packed</span>
              {freeShipping && <><span className="h-4 w-px bg-white/20" /><span className="flex items-center gap-2"><Truck size={16} className="text-[#e8bd71]" /> Free standard shipping</span></>}
            </div>
          </div>
        </div>
        <a className="hero-scroll-cue" href="#catalog" onClick={(event) => { event.preventDefault(); resultsRef.current?.scrollIntoView() }} aria-label="Scroll to products"><span>Browse products</span><ChevronDown size={16} /></a>
      </section>

      <section className="bg-[var(--sf-canvas)]" id="catalog" aria-label="Products">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-14 lg:py-12" ref={resultsRef} style={{ scrollMarginTop: 150 }}>
          <div className="mb-5 flex flex-col gap-3 border-b border-[var(--sf-line)] pb-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[var(--sf-ink-soft)]" aria-live="polite">
              {isLoading ? 'Loading products…' : results.length ? <><b className="text-[var(--sf-ink)]">{first}–{first + items.length - 1}</b> of <b className="text-[var(--sf-ink)]">{results.length}</b> results{params.q ? <> for <b className="text-[var(--sf-deal)]">“{params.q}”</b></> : null}</> : 'No results'}
            </p>
            <div className="flex items-center gap-2">
              <button className="sf-btn sf-btn-outline sf-btn-sm lg:!hidden" type="button" onClick={() => setFilterOpen(true)} aria-haspopup="dialog">
                <Filter size={14} /> Filters{filterCount ? ` (${filterCount})` : ''}
              </button>
              <label className="flex items-center gap-2 text-sm">
                <span className="hidden text-[var(--sf-muted)] sm:inline">Sort by</span>
                <select className="sf-select" aria-label="Sort by" value={params.sort} onChange={(event) => update({ sort: event.target.value as CatalogListSort })}>
                  {(Object.keys(SORT_LABELS) as CatalogListSort[]).filter((sort) => sort !== 'relevance' || params.q).map((sort) => <option key={sort} value={sort}>{SORT_LABELS[sort]}</option>)}
                </select>
              </label>
              <div className="view-switch" role="group" aria-label="View">
                <button className={view === 'grid' ? 'is-active' : ''} onClick={() => changeView('grid')} aria-pressed={view === 'grid'} aria-label="Grid view" type="button"><Grid2X2 size={15} /></button>
                <button className={view === 'list' ? 'is-active' : ''} onClick={() => changeView('list')} aria-pressed={view === 'list'} aria-label="List view" type="button"><LayoutList size={16} /></button>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
            <aside className="hidden lg:block" aria-label="Filters">
              <div className="sticky top-[150px]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold">Filters</h2>
                  {filterCount > 0 && <button type="button" className="sf-link text-sm" onClick={() => update({ category: null, rating: 0, minPrice: null, maxPrice: null, sizes: [], availability: 'all', deals: false })}>Clear ({filterCount})</button>}
                </div>
                {!isLoading && <FilterPanel categories={categories} params={params} facets={facets} onChange={update} />}
              </div>
            </aside>

            <div className="min-w-0">
              <ActiveFilters params={params} onChange={update} />
              {isError ? (
                <ErrorState title="We couldn’t load the products" onRetry={() => void refetch()} />
              ) : isLoading ? (
                <ProductGridSkeleton count={6} />
              ) : results.length ? (
                <>
                  <h2 className="sf-sr-only">{heading}</h2>
                  <ul className={`sf-grid ${view === 'list' ? 'sf-grid-list' : ''}`}>
                    {items.map((product, index) => (
                      <li key={product.id} className="contents"><ProductTile product={product} layout={view} priority={index < 3} /></li>
                    ))}
                  </ul>
                  <Pagination page={page} pageCount={pageCount} onPage={goToPage} />
                </>
              ) : (
                <EmptyState
                  icon={<SearchX size={24} />}
                  title={params.q ? `No results for “${params.q}”` : 'No products match these filters'}
                  action={<button type="button" className="sf-btn sf-btn-primary sf-btn-sm" onClick={() => update({ q: '', category: null, rating: 0, minPrice: null, maxPrice: null, sizes: [], availability: 'all', deals: false })}>Clear search and filters</button>}
                >
                  Try a different spelling, fewer words, or remove a filter.
                </EmptyState>
              )}
            </div>
          </div>
        </div>
      </section>

      <StatsBand />
      <NewsletterSection />

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={`Filters${filterCount ? ` (${filterCount})` : ''}`}
        variant="left"
        footer={<button type="button" className="sf-btn sf-btn-primary sf-btn-block" onClick={() => setFilterOpen(false)}>Show {results.length} results</button>}
      >
        <FilterPanel categories={categories} params={params} facets={facets} onChange={update} />
        {filterCount > 0 && <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm mt-2" onClick={() => update({ category: null, rating: 0, minPrice: null, maxPrice: null, sizes: [], availability: 'all', deals: false })}>Clear all filters</button>}
      </Modal>
      <Footer />
    </main>
  )
})
