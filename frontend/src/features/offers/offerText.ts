import type { StoreOffer } from '../../types/catalog'
import { formatMoney } from '../../utils/money'

/** "On orders over ₹999 · 12 left" — the conditions that come from the coupon's Pricing Rule. */
export function offerTerms(offer: StoreOffer) {
  return [offer.minOrder ? `On orders over ${formatMoney(offer.minOrder)}` : null, offer.remainingUses !== null && offer.remainingUses <= 20 ? `${offer.remainingUses} left` : null]
    .filter(Boolean)
    .join(' · ')
}
