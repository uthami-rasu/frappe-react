import type { Address } from '../types/account'

export function formatAddress(address: Address) {
  return [address.address_line1, address.address_line2, address.city, address.state, address.pincode, address.country].filter(Boolean).join(', ')
}
