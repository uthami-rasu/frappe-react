import { describe, expect, it } from 'vitest'
import { pickPopup } from '../features/offers/popupSchedule'
import type { StoreOffer } from '../types/catalog'

const NOW = new Date('2026-10-12T10:00:00').getTime()
const offer = (overrides: Partial<StoreOffer>): StoreOffer => ({
  id: 'o1', title: 'Offer', description: '', image: '', placement: 'Popup', priority: 0, ctaLabel: 'Shop', ctaLink: '#honey',
  couponCode: null, discount: null, minOrder: 0, remainingUses: null, expiresAt: null, itemCode: null, itemGroups: [],
  popupFrequency: 'Once per day', popupDelay: 0, ...overrides,
})

describe('pickPopup', () => {
  it('picks the highest-priority popup and ignores banners', () => {
    const offers = [offer({ id: 'low', priority: 1 }), offer({ id: 'high', priority: 9 }), offer({ id: 'banner', placement: 'Home Banner', priority: 99 })]
    expect(pickPopup(offers, {}, new Set(), NOW)?.id).toBe('high')
  })

  it('respects frequency limits', () => {
    const hourAgo = NOW - 60 * 60 * 1000
    const twoDaysAgo = NOW - 48 * 60 * 60 * 1000
    expect(pickPopup([offer({ popupFrequency: 'Once' })], { o1: twoDaysAgo }, new Set(), NOW)).toBeNull()
    expect(pickPopup([offer({ popupFrequency: 'Once per day' })], { o1: hourAgo }, new Set(), NOW)).toBeNull()
    expect(pickPopup([offer({ popupFrequency: 'Once per day' })], { o1: twoDaysAgo }, new Set(), NOW)?.id).toBe('o1')
    expect(pickPopup([offer({ popupFrequency: 'Once per visit' })], { o1: hourAgo }, new Set(), NOW)?.id).toBe('o1')
    expect(pickPopup([offer({ popupFrequency: 'Once per visit' })], {}, new Set(['o1']), NOW)).toBeNull()
  })

  it('never shows an expired offer', () => {
    expect(pickPopup([offer({ expiresAt: '2026-10-12 09:59:59' })], {}, new Set(), NOW)).toBeNull()
    expect(pickPopup([offer({ expiresAt: '2026-10-13 00:00:00' })], {}, new Set(), NOW)?.id).toBe('o1')
  })
})
