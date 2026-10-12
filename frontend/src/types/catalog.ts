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
  // units on submitted orders in the last 90 days (popularity)
  sold: number
}

export type CatalogSort = 'featured' | 'newest' | 'price-low' | 'price-high' | 'rating' | 'popular'

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
  email?: string | null
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

// bossco.api.get_storefront_config
export type ShippingOption = { id: ShippingMethod; label: string; amount: number }
export type StorefrontConfig = {
  storeName: string
  announcement: string
  currency: string
  deliveryDays: number
  shippingOptions: ShippingOption[]
  requireVerifiedPurchase: boolean
}

// bossco.api.get_product
export type ProductDetails = { id: string; description: string; images: string[]; specs: Array<{ label: string; value: string }> }

// bossco.api.get_related_products
export type RelatedProducts = { boughtTogether: string[]; similar: string[] }

// bossco.api.get_cart_quote: what checkout would charge, calculated by ERPNext
export type QuoteLine = { itemCode: string; qty: number; listRate: number; rate: number; amount: number }
export type QuoteIssue = { itemCode: string; type: 'unavailable' | 'out_of_stock' | 'limited_stock'; message: string; available?: number }
export type CartQuote = {
  lines: QuoteLine[]
  subtotal: number
  discount: number
  shipping: number
  taxes: number
  total: number
  currency: string
  error: string | null
  issues: QuoteIssue[]
  coupon: { code: string | null; applied: boolean; message: string | null }
}

// bossco.offers.get_active_offers
export type OfferPlacement = 'Home Banner' | 'Popup' | 'Product Page'
export type StoreOffer = {
  id: string
  title: string
  description: string
  image: string
  placement: OfferPlacement
  priority: number
  ctaLabel: string
  ctaLink: string
  couponCode: string | null
  discount: string | null
  minOrder: number
  remainingUses: number | null
  expiresAt: string | null
  itemCode: string | null
  itemGroups: string[]
  popupFrequency: 'Once' | 'Once per day' | 'Once per visit'
  popupDelay: number
}

// bossco.reviews.get_reviews
export type ReviewSort = 'newest' | 'helpful' | 'highest' | 'lowest'
export type Review = {
  id: string
  author: string
  rating: number
  title: string
  comment: string
  verifiedPurchase: boolean
  helpful: number
  votedHelpful: boolean
  date: string
}
export type ReviewSummary = { average: number; total: number; distribution: Record<'1' | '2' | '3' | '4' | '5', number> }
export type ReviewViewer = {
  loggedIn: boolean
  canReview: boolean
  verifiedPurchase: boolean
  reason: string | null
  myReview: { name: string; rating: number; title: string; comment: string; status: string } | null
}
export type ReviewPage = { summary: ReviewSummary; reviews: Review[]; hasMore: boolean; viewer: ReviewViewer }
