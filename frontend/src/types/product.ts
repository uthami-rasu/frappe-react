export type ProductCategory =
  | 'Nuts'
  | 'Mixed nuts'
  | 'Peanuts'
  | 'Dried fruits'
  | 'Other nuts'

export type Product = {
  id: number
  name: string
  image: string
  category: ProductCategory
  weight: string
  price: number
  reviews: number
  badge?: string
  stock?: number
}

export type TrendingProduct = Pick<
  Product,
  'id' | 'name' | 'image' | 'category' | 'price'
> & {
  layout: 'standard' | 'wide'
}
