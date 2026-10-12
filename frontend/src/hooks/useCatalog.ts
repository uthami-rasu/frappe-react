import { useGetCatalogQuery } from '../features/api/storeApi'
import type { CatalogProduct, CategoryNode } from '../types/catalog'

const noProducts: CatalogProduct[] = []
const noCategories: CategoryNode[] = []

export function useCatalog() {
  const { data, isLoading, isError, refetch } = useGetCatalogQuery()
  return { products: data?.products ?? noProducts, categories: data?.categories ?? noCategories, isLoading, isError, refetch }
}

export function uniqueCategories(products: CatalogProduct[]) {
  return Array.from(new Set(products.map((product) => product.category)))
}

// Link to the catalog page filtered to one Item Group
export const categoryHref = (category: string) => `#honey?category=${encodeURIComponent(category)}`
