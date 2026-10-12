import { useGetCatalogQuery } from '../features/api/storeApi'
import type { CatalogProduct, CategoryNode } from '../types/catalog'

const noProducts: CatalogProduct[] = []
const noCategories: CategoryNode[] = []

// Subscribe to the data and status only, not to every fetch flag, so a background refetch
// doesn't re-render every component that shows products.
const selectCatalog = ({ data, isLoading, isError }: { data?: { products: CatalogProduct[]; categories: CategoryNode[] }; isLoading: boolean; isError: boolean }) => ({
  products: data?.products ?? noProducts,
  categories: data?.categories ?? noCategories,
  isLoading,
  isError,
})

export function useCatalog() {
  const { refetch, ...catalog } = useGetCatalogQuery(undefined, { selectFromResult: selectCatalog })
  return { ...catalog, refetch }
}

export function uniqueCategories(products: CatalogProduct[]) {
  return Array.from(new Set(products.map((product) => product.category)))
}

// Link to the catalog page filtered to one Item Group
export const categoryHref = (category: string) => `#honey?category=${encodeURIComponent(category)}`
