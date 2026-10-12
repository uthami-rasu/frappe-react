import { BadgePercent } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useGetActiveOffersQuery } from '../../features/api/storeApi'
import { loadHistory, pickPopup, recordShown } from '../../features/offers/popupSchedule'
import type { StoreOffer } from '../../types/catalog'
import { Modal } from '../ui/Modal'
import { offerTerms } from '../../features/offers/offerText'
import { OfferCode, OfferExpiry } from './OfferParts'

// offers shown during this page load, for "Once per visit"
const shownThisVisit = new Set<string>()

/**
 * Promotional popup. Frappe decides which offers are live and for whom (dates, audience,
 * coupon still redeemable); this decides when, using the offer's frequency and delay.
 * Hidden on checkout and account pages so it never interrupts a purchase.
 */
export function OfferPopup({ suppressed }: { suppressed: boolean }) {
  const { data: offers } = useGetActiveOffersQuery()
  const [offer, setOffer] = useState<StoreOffer | null>(null)
  const timer = useRef<number>(undefined)

  useEffect(() => {
    window.clearTimeout(timer.current)
    if (suppressed || !offers?.length || offer) return
    const next = pickPopup(offers, loadHistory(), shownThisVisit)
    if (!next) return
    timer.current = window.setTimeout(() => {
      shownThisVisit.add(next.id)
      recordShown(next.id)
      setOffer(next)
    }, Math.max(1, next.popupDelay) * 1000)
    return () => window.clearTimeout(timer.current)
  }, [offers, suppressed, offer])

  if (!offer) return null
  const terms = offerTerms(offer)
  const close = () => setOffer(null)
  return (
    <Modal open variant="dialog" title={offer.title} hideTitle onClose={close}>
      <div className="relative overflow-hidden">
        {offer.image ? (
          <img src={offer.image} alt="" className="h-44 w-full object-cover" />
        ) : (
          <div className="grid h-28 place-items-center bg-[#173f32] text-[#f0d59f]"><BadgePercent size={44} strokeWidth={1.5} /></div>
        )}
      </div>
      <div className="grid gap-3 p-6 text-center">
        {offer.discount && <p className="text-sm font-extrabold uppercase tracking-[.14em] text-[var(--sf-deal)]">{offer.discount}</p>}
        <h2 className="font-display text-3xl font-bold leading-tight">{offer.title}</h2>
        {offer.description && <p className="text-sm leading-6 text-[var(--sf-ink-soft)]">{offer.description}</p>}
        {terms && <p className="sf-hint">{terms}</p>}
        {offer.couponCode && <div className="mx-auto rounded-xl bg-[#173f32] p-1"><OfferCode code={offer.couponCode} /></div>}
        <div className="mx-auto"><OfferExpiry expiresAt={offer.expiresAt} /></div>
        <a href={offer.ctaLink} className="sf-btn sf-btn-primary sf-btn-block mt-1" onClick={close} data-autofocus>{offer.ctaLabel}</a>
        <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm" onClick={close}>No thanks</button>
      </div>
    </Modal>
  )
}
