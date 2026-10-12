import { describe, expect, it } from 'vitest'
import type { CatalogProduct, CategoryNode } from '../types/catalog'
import {
  activeFilterCount, categoryTrail, categoryWithDescendants, discountPercent, paginate, parseCatalogParams, priceBands,
  queryCatalog, searchScore, sortProducts, toQueryRecord,
} from '../features/catalog/catalogQuery'

const product = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  id: 'X', slug: 'x', name: 'X', subtitle: '', image: '', origin: '', category: 'Nuts', size: '500g', price: 100,
  compareAtPrice: null, rating: 0, reviews: 0, badge: null, inStock: true, stock: 10, featured: false, trending: false,
  createdAt: '2026-01-01', sold: 0, ...overrides,
})

const categories: CategoryNode[] = [
  { name: 'Honey', parent: null, depth: 0, count: 2 },
  { name: 'Raw honey', parent: 'Honey', depth: 1, count: 1 },
  { name: 'Comb', parent: 'Raw honey', depth: 2, count: 1 },
  { name: 'Nuts', parent: null, depth: 0, count: 2 },
]

const products = [
  product({ id: 'A', name: 'Acacia Gold Honey', category: 'Raw honey', price: 620, rating: 4.5, reviews: 3, sold: 9, size: '250g' }),
  product({ id: 'B', name: 'Wild Comb', category: 'Comb', price: 1250, rating: 3.2, reviews: 1, sold: 2, size: '1kg', compareAtPrice: 1400 }),
  product({ id: 'C', name: 'California Almonds', category: 'Nuts', price: 699, rating: 0, sold: 30, inStock: false, stock: 0 }),
  product({ id: 'D', name: 'Honey Roasted Cashews', category: 'Nuts', price: 349, rating: 4.9, reviews: 12, createdAt: '2026-05-01' }),
]

describe('URL params', () => {
  it('round-trips and drops defaults', () => {
    const params = parseCatalogParams(new URLSearchParams('q=honey&category=Honey&min=100&max=900&rating=4&sizes=250g,1kg&stock=in&deals=1&sort=price-low&page=2'))
    expect(params).toMatchObject({ q: 'honey', category: 'Honey', minPrice: 100, maxPrice: 900, rating: 4, sizes: ['250g', '1kg'], availability: 'in-stock', deals: true, sort: 'price-low', page: 2 })
    expect(parseCatalogParams(new URLSearchParams(toQueryRecord(params)))).toEqual(params)
    expect(toQueryRecord(parseCatalogParams(new URLSearchParams('')))).toEqual({})
    expect(activeFilterCount(params)).toBe(6)
  })

  it('ignores junk values', () => {
    const params = parseCatalogParams(new URLSearchParams('min=-5&max=abc&rating=9&page=-3&sort=evil'))
    expect(params).toMatchObject({ minPrice: null, maxPrice: null, rating: 4, page: 1, sort: 'featured' })
    expect(parseCatalogParams(new URLSearchParams('q=nuts')).sort).toBe('relevance')
  })
})

describe('categories', () => {
  it('includes every sub-category', () => {
    expect([...categoryWithDescendants(categories, 'Honey')].sort()).toEqual(['Comb', 'Honey', 'Raw honey'])
    expect(categoryTrail(categories, 'Comb')).toEqual(['Honey', 'Raw honey', 'Comb'])
  })
})

describe('search and sort', () => {
  it('requires every word and ranks name-prefix matches first', () => {
    expect(searchScore(products[0], 'honey gold')).toBeGreaterThan(0)
    expect(searchScore(products[0], 'honey pistachio')).toBe(0)
    expect(searchScore(products[3], 'honey')).toBeGreaterThan(searchScore(products[1], 'comb raw'))
    const { results } = queryCatalog(products, categories, parseCatalogParams(new URLSearchParams('q=honey')))
    expect(results.map((item) => item.id)).toEqual(['D', 'A'])
  })

  it('sorts by real product data, keeping catalog order on ties', () => {
    expect(sortProducts(products, 'price-low').map((item) => item.id)).toEqual(['D', 'A', 'C', 'B'])
    expect(sortProducts(products, 'rating').map((item) => item.id)).toEqual(['D', 'A', 'B', 'C'])
    expect(sortProducts(products, 'popular').map((item) => item.id)).toEqual(['C', 'A', 'B', 'D'])
    expect(sortProducts(products, 'newest')[0].id).toBe('D')
    expect(sortProducts(products, 'featured').map((item) => item.id)).toEqual(['A', 'B', 'C', 'D'])
  })
})

describe('filters and facets', () => {
  it('filters on category tree, price, rating, size, stock and deals', () => {
    const run = (query: string) => queryCatalog(products, categories, parseCatalogParams(new URLSearchParams(query))).results.map((item) => item.id)
    expect(run('category=Honey')).toEqual(['A', 'B'])
    expect(run('min=600&max=700')).toEqual(['A', 'C'])
    expect(run('rating=4')).toEqual(['A', 'D'])
    expect(run('sizes=1kg')).toEqual(['B'])
    expect(run('stock=in').includes('C')).toBe(false)
    expect(run('deals=1')).toEqual(['B'])
  })

  it('counts each facet against the other active filters', () => {
    const { facets } = queryCatalog(products, categories, parseCatalogParams(new URLSearchParams('category=Honey&rating=4')))
    expect(facets.categories.get('Nuts')).toBe(1) // D only, since rating ≥ 4 still applies
    expect(facets.categories.get('Honey')).toBe(1)
    expect(facets.ratings.find((rating) => rating.value === 3)?.count).toBe(2) // ignores the rating filter itself
    expect(facets.inStock).toBe(1)
  })
})

describe('helpers', () => {
  it('paginates and clamps the page', () => {
    expect(paginate([1, 2, 3, 4, 5], 9, 2)).toEqual({ items: [5], page: 3, pageCount: 3 })
  })

  it('builds price bands that cover the range', () => {
    const bands = priceBands(349, 1250)
    expect(bands[0]).toEqual({ min: null, max: 500 })
    expect(bands[bands.length - 1].max).toBeNull()
  })

  it('computes discounts only for real markdowns', () => {
    expect(discountPercent({ price: 75, compareAtPrice: 100 })).toBe(25)
    expect(discountPercent({ price: 100, compareAtPrice: 90 })).toBe(0)
  })
})
