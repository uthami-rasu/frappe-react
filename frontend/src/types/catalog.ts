// Shape returned by bossco.api.get_catalog (bossco/storefront.py → get_store_products)
export type CatalogProduct = {
  id: string
  slug: string
  name: string
  subtitle: string
  image: string
  origin: string
  category: string
  size: string
  price: number
  compareAtPrice: number | null
  rating: number
  reviews: number
  badge: string | null
  inStock: boolean
  stock: number | null
  featured: boolean
  trending: boolean
  createdAt: string
}

export type CatalogSort = 'featured' | 'newest' | 'price-low' | 'price-high' | 'rating'

export type ShippingMethod = 'free' | 'express' | 'pickup'

export type CheckoutContact = { first_name: string; last_name: string; email: string; phone: string }

export type CheckoutAddress = { address_line1: string; city: string; state: string; pincode: string; country: string }

export type PaymentMethod = 'cod' | 'card' | 'upi'

// Sent to bossco.api.place_order; card details only reach the (mock) gateway and are never stored
export type PaymentDetails =
  | { method: 'cod' }
  | { method: 'card'; card_number: string; expiry: string; cvc: string; name: string }
  | { method: 'upi'; upi_id: string }

export type PlacedOrder = {
  name: string
  grand_total: number
  currency: string
  transaction_date: string
  payment_method: string
  payment_reference: string | null
  paid: boolean
}

// Item Group with store products (bossco/storefront.py → get_store_categories)
export type CategoryNode = { name: string; parent: string | null; depth: number; count: number }

export type FilterOption<T> = { value: T; count: number }

export type CatalogFilterOptions = {
  categories: CategoryNode[]
  sizes: FilterOption<string>[]
  price: { min: number; max: number }
  ratings: FilterOption<number>[]
  inStock: number
  total: number
}

export type ProductQuery = {
  category?: string
  search?: string
  sizes?: string
  max_price?: number
  min_rating?: number
  in_stock?: 0 | 1
  sort?: CatalogSort
  limit?: number
}

export type ProductQueryResult = { products: CatalogProduct[]; total: number; filters: CatalogFilterOptions }
