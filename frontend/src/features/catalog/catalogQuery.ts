import type { CatalogProduct, CatalogSort, CategoryNode } from '../../types/catalog'

// Catalog page state lives in the URL (#honey?q=…&category=…&sort=…), so it survives reloads,
// back/forward and shared links. Everything here is pure so it can be unit tested.

export type CatalogListSort = CatalogSort | 'relevance'
export type Availability = 'all' | 'in-stock'

export type CatalogParams = {
  q: string
  category: string | null
  minPrice: number | null
  maxPrice: number | null
  rating: number
  sizes: string[]
  availability: Availability
  deals: boolean
  sort: CatalogListSort
  page: number
}

export const PAGE_SIZE = 12
export const RATING_STEPS = [4, 3, 2, 1] as const

export const SORT_LABELS: Record<CatalogListSort, string> = {
  relevance: 'Relevance',
  featured: 'Featured',
  popular: 'Best sellers',
  rating: 'Avg. customer review',
  'price-low': 'Price: low to high',
  'price-high': 'Price: high to low',
  newest: 'Newest arrivals',
}

const SORTS = Object.keys(SORT_LABELS) as CatalogListSort[]

const toNumber = (value: string | null) => {
  if (value === null || value.trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export function parseCatalogParams(params: URLSearchParams): CatalogParams {
  const q = (params.get('q') ?? '').trim()
  const sort = params.get('sort') as CatalogListSort | null
  return {
    q,
    category: params.get('category') || null,
    minPrice: toNumber(params.get('min')),
    maxPrice: toNumber(params.get('max')),
    rating: Math.min(4, Math.max(0, Math.floor(Number(params.get('rating')) || 0))),
    sizes: (params.get('sizes') ?? '').split(',').map((size) => size.trim()).filter(Boolean),
    availability: params.get('stock') === 'in' ? 'in-stock' : 'all',
    deals: params.get('deals') === '1',
    sort: sort && SORTS.includes(sort) ? sort : q ? 'relevance' : 'featured',
    page: Math.max(1, Math.floor(Number(params.get('page')) || 1)),
  }
}

/** Only non-default values, so URLs stay short. */
export function toQueryRecord(params: CatalogParams): Record<string, string> {
  const record: Record<string, string> = {}
  if (params.q) record.q = params.q
  if (params.category) record.category = params.category
  if (params.minPrice !== null) record.min = String(params.minPrice)
  if (params.maxPrice !== null) record.max = String(params.maxPrice)
  if (params.rating) record.rating = String(params.rating)
  if (params.sizes.length) record.sizes = params.sizes.join(',')
  if (params.availability === 'in-stock') record.stock = 'in'
  if (params.deals) record.deals = '1'
  if (params.sort !== (params.q ? 'relevance' : 'featured')) record.sort = params.sort
  if (params.page > 1) record.page = String(params.page)
  return record
}

export function activeFilterCount(params: CatalogParams) {
  return [
    params.category,
    params.minPrice !== null || params.maxPrice !== null,
    params.rating,
    params.sizes.length,
    params.availability === 'in-stock',
    params.deals,
  ].filter(Boolean).length
}

/** The category plus every sub-category under it (Item Groups form a tree). */
export function categoryWithDescendants(categories: CategoryNode[], name: string) {
  const names = new Set([name])
  let grew = true
  while (grew) {
    grew = false
    for (const category of categories) {
      if (category.parent && names.has(category.parent) && !names.has(category.name)) {
        names.add(category.name)
        grew = true
      }
    }
  }
  return names
}

/** Root-to-leaf trail for breadcrumbs, e.g. ['Honey', 'Raw honey']. */
export function categoryTrail(categories: CategoryNode[], name: string | null) {
  const trail: string[] = []
  let current = name ? categories.find((category) => category.name === name) : undefined
  while (current && trail.length < 10) {
    trail.unshift(current.name)
    current = current.parent ? categories.find((category) => category.name === current!.parent) : undefined
  }
  return trail
}

const normalize = (text: string) => text.toLocaleLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')

/** 0 = no match; higher = better. Every word of the query has to match somewhere. */
export function searchScore(product: CatalogProduct, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (!words.length) return 1
  const name = normalize(product.name)
  const other = normalize(`${product.category} ${product.subtitle} ${product.origin} ${product.size} ${product.id}`)
  let score = 0
  for (const word of words) {
    if (name.startsWith(word)) score += 6
    else if (name.split(/\s+/).some((part) => part.startsWith(word))) score += 4
    else if (name.includes(word)) score += 3
    else if (other.includes(word)) score += 1
    else return 0
  }
  return score
}

export const isDeal = (product: CatalogProduct) => Boolean(product.compareAtPrice && product.compareAtPrice > product.price)

export const discountPercent = (product: Pick<CatalogProduct, 'price' | 'compareAtPrice'>) =>
  product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0

type Dimension = 'category' | 'price' | 'rating' | 'sizes' | 'availability' | 'deals'

function matches(product: CatalogProduct, params: CatalogParams, categorySet: Set<string> | null, skip?: Dimension) {
  if (params.q && !searchScore(product, params.q)) return false
  if (skip !== 'category' && categorySet && !categorySet.has(product.category)) return false
  if (skip !== 'price' && params.minPrice !== null && product.price < params.minPrice) return false
  if (skip !== 'price' && params.maxPrice !== null && product.price > params.maxPrice) return false
  if (skip !== 'rating' && params.rating && product.rating < params.rating) return false
  if (skip !== 'sizes' && params.sizes.length && !params.sizes.includes(product.size)) return false
  if (skip !== 'availability' && params.availability === 'in-stock' && !product.inStock) return false
  if (skip !== 'deals' && params.deals && !isDeal(product)) return false
  return true
}

export function sortProducts(products: CatalogProduct[], sort: CatalogListSort, query = '') {
  const list = [...products]
  // ties keep the catalog order (Item Sort Order), which is the "featured" order
  const order = new Map(products.map((product, index) => [product.id, index]))
  const byOrder = (a: CatalogProduct, b: CatalogProduct) => order.get(a.id)! - order.get(b.id)!
  const compare: Record<CatalogListSort, (a: CatalogProduct, b: CatalogProduct) => number> = {
    relevance: (a, b) => searchScore(b, query) - searchScore(a, query) || Number(b.inStock) - Number(a.inStock),
    featured: () => 0,
    popular: (a, b) => b.sold - a.sold || b.reviews - a.reviews,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  }
  return list.sort((a, b) => compare[sort](a, b) || byOrder(a, b))
}

export type Facets = {
  categories: Map<string, number>
  sizes: Array<{ value: string; count: number }>
  ratings: Array<{ value: number; count: number }>
  inStock: number
  deals: number
  price: { min: number; max: number }
}

/**
 * Filtered + sorted results and, for each filter, how many products each choice would give
 * with the *other* filters applied (so counts never promise an empty page).
 */
export function queryCatalog(products: CatalogProduct[], categories: CategoryNode[], params: CatalogParams) {
  const categorySet = params.category ? categoryWithDescendants(categories, params.category) : null
  const results = sortProducts(products.filter((product) => matches(product, params, categorySet)), params.sort, params.q)

  const without = (dimension: Dimension) => products.filter((product) => matches(product, params, categorySet, dimension))
  const forCategories = without('category')
  const categoryCounts = new Map<string, number>()
  for (const category of categories) {
    const names = categoryWithDescendants(categories, category.name)
    categoryCounts.set(category.name, forCategories.filter((product) => names.has(product.category)).length)
  }
  const forSizes = without('sizes')
  const sizes = Array.from(new Set(products.map((product) => product.size).filter(Boolean)))
    .map((value) => ({ value, count: forSizes.filter((product) => product.size === value).length }))
    .sort((a, b) => sizeWeight(a.value) - sizeWeight(b.value))
  const forRatings = without('rating')
  const prices = products.map((product) => product.price)

  return {
    results,
    facets: {
      categories: categoryCounts,
      sizes,
      ratings: RATING_STEPS.map((value) => ({ value, count: forRatings.filter((product) => product.rating >= value).length })),
      inStock: without('availability').filter((product) => product.inStock).length,
      deals: without('deals').filter(isDeal).length,
      price: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    } satisfies Facets,
  }
}

/** "250g" < "500g" < "1kg"; anything else after, as in bossco/storefront.py size_sort_key. */
export function sizeWeight(size: string) {
  const match = size.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(g|gm|kg|ml|l)$/)
  if (!match) return Number.MAX_SAFE_INTEGER
  const amount = Number(match[1])
  return match[2] === 'kg' || match[2] === 'l' ? amount * 1000 : amount
}

/** A few price bands that fit the catalog, e.g. Under ₹500 · ₹500–₹1,000 · Over ₹1,000. */
export function priceBands(min: number, max: number): Array<{ min: number | null; max: number | null }> {
  if (max <= 0 || max === min) return []
  const step = max <= 1000 ? 250 : max <= 3000 ? 500 : 1000
  const bands: Array<{ min: number | null; max: number | null }> = []
  let upper = Math.max(step, Math.ceil((min + 1) / step) * step)
  bands.push({ min: null, max: upper })
  while (upper < max && bands.length < 4) {
    const lower = upper
    upper += step
    bands.push({ min: lower, max: upper >= max ? null : upper })
  }
  if (bands[bands.length - 1].max !== null) bands.push({ min: upper, max: null })
  return bands
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount }
}
