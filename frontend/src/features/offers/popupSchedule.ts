import type { StoreOffer } from '../../types/catalog'

// Which promotional popup to show, if any. Frappe decides which offers are live and for whom;
// this only decides how often a shopper sees them (the offer's "Show Popup" setting).

export type PopupHistory = Record<string, number> // offer id → last time it was shown (ms)

const DAY = 24 * 60 * 60 * 1000
export const STORAGE_KEY = 'bossco:popups'

export function isDue(offer: StoreOffer, history: PopupHistory, shownThisVisit: ReadonlySet<string>, now: number) {
  const lastShown = history[offer.id]
  if (offer.popupFrequency === 'Once') return lastShown === undefined
  if (offer.popupFrequency === 'Once per visit') return !shownThisVisit.has(offer.id)
  return lastShown === undefined || now - lastShown >= DAY
}

/** Highest-priority popup offer that is due, unexpired and not already showing this visit. */
export function pickPopup(offers: StoreOffer[], history: PopupHistory, shownThisVisit: ReadonlySet<string>, now = Date.now()) {
  return offers
    .filter((offer) => offer.placement === 'Popup')
    .filter((offer) => !offer.expiresAt || new Date(offer.expiresAt.replace(' ', 'T')).getTime() > now)
    .filter((offer) => !shownThisVisit.has(offer.id) && isDue(offer, history, shownThisVisit, now))
    .sort((a, b) => b.priority - a.priority)[0] ?? null
}

export function loadHistory(): PopupHistory {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as PopupHistory
  } catch {
    return {}
  }
}

export function recordShown(offerId: string, now = Date.now()) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadHistory(), [offerId]: now }))
  } catch {
    // storage unavailable (private mode): the popup may show again next visit
  }
}
