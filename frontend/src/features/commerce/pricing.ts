import type { CatalogProduct } from '../../types/catalog'
import type { CartLine } from './commerceSlice'

export function getProduct(products: CatalogProduct[], line: CartLine) {
  return products.find((product) => product.id === line.productId)
}

// Shipping options and every total come from ERPNext (bossco.api.get_storefront_config / get_cart_quote).
