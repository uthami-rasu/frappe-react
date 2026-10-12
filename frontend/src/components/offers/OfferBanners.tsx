import { ArrowRight, BadgePercent } from 'lucide-react'
import { useGetActiveOffersQuery } from '../../features/api/storeApi'
import type { StoreOffer } from '../../types/catalog'
import { Skeleton } from '../ui/Feedback'
import { offerTerms } from '../../features/offers/offerText'
import { OfferCode, OfferExpiry } from './OfferParts'

function OfferBanner({ offer }: { offer: StoreOffer }) {
  const terms = offerTerms(offer)
  return (
    <article className={`sf-offer-banner ${offer.image ? 'has-image' : ''}`} aria-labelledby={`offer-${offer.id}`}>
      {offer.image && <img src={offer.image} alt="" loading="lazy" decoding="async" />}
      <div className="flex flex-wrap items-center gap-3">
        {offer.discount && <span className="sf-badge sf-badge-deal"><BadgePercent size={13} /> {offer.discount}</span>}
        <OfferExpiry expiresAt={offer.expiresAt} />
      </div>
      <div>
        <h3 id={`offer-${offer.id}`} className="font-display text-[1.7rem] font-bold leading-tight text-white">{offer.title}</h3>
        {offer.description && <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/80">{offer.description}</p>}
        {terms && <p className="mt-1 text-xs font-semibold text-white/60">{terms}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {offer.couponCode && <OfferCode code={offer.couponCode} />}
        <a href={offer.ctaLink} className="sf-btn sf-btn-accent sf-btn-sm">{offer.ctaLabel} <ArrowRight size={14} /></a>
      </div>
    </article>
  )
}

/** Home page promotions managed in Frappe (Storefront Offer, placement "Home Banner"). */
export function OfferBanners() {
  const { data: offers, isLoading, isError } = useGetActiveOffersQuery()
  const banners = (offers ?? []).filter((offer) => offer.placement === 'Home Banner').slice(0, 3)
  if (isError || (!isLoading && !banners.length)) return null
  return (
    <section className="sf-container py-8" aria-label="Current offers">
      <div className={`grid gap-4 ${banners.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {isLoading ? <><Skeleton className="h-44 rounded-[22px]" /><Skeleton className="hidden h-44 rounded-[22px] md:block" /></> : banners.map((offer) => <OfferBanner key={offer.id} offer={offer} />)}
      </div>
    </section>
  )
}
