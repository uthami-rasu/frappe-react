import type { CatalogProduct, ShippingMethod } from '../../types/catalog'
import type { CartLine } from './commerceSlice'

export function getProduct(products: CatalogProduct[], line: CartLine) {
  return products.find((product) => product.id === line.productId)
}

// Keep in sync with SHIPPING_CHARGES in bossco/api.py, which is what the order is billed with
export const shippingOptions: Array<{ id: ShippingMethod; label: string; value: number }> = [
  { id: 'free', label: 'Free shipping', value: 0 },
  { id: 'express', label: 'Express shipping', value: 150 },
  { id: 'pickup', label: 'Pick Up', value: 0 },
]

export const shippingCostFor = (method: ShippingMethod) => shippingOptions.find((option) => option.id === method)?.value ?? 0
