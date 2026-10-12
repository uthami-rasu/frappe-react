import { memo } from 'react'
import { BenefitsSection } from '../components/home/BenefitsSection'
import { FavoritesSection } from '../components/home/FavoritesSection'
import { HeroSection } from '../components/home/HeroSection'
import { HoneySection } from '../components/home/HoneySection'
import { HamperBanner } from '../components/home/HamperBanner'
import { GalleryStatsSection } from '../components/home/GalleryStatsSection'
import { Footer } from '../components/layout/Footer'
import { NewsletterSection } from '../components/home/NewsletterSection'
import { TestimonialSection } from '../components/home/TestimonialSection'
import { NutDecorations } from '../components/home/NutDecorations'
import { TrendingSection } from '../components/home/TrendingSection'
import { RecentlyViewedRail, ShopRails } from '../components/home/ShopRails'
import { OfferBanners } from '../components/offers/OfferBanners'
import { RenderWhenVisible } from '../components/ui/RenderWhenVisible'

// no props: it only re-renders when its own sections' data changes, not with the App shell
export const HomePage = memo(function HomePage() {
  return (
    <main>
      <HeroSection />
      <div className="relative isolate flow-root bg-stone-50 dark:bg-stone-950">
        <NutDecorations />
        <BenefitsSection />
        <OfferBanners />
        <FavoritesSection />
      </div>
      <RenderWhenVisible minHeight={900}><ShopRails /></RenderWhenVisible>
      <HoneySection />
      <HamperBanner />
      <TrendingSection />
      <GalleryStatsSection />
      <RenderWhenVisible minHeight={0}><RecentlyViewedRail /></RenderWhenVisible>
      <NewsletterSection />
      <TestimonialSection />
      <Footer />
    </main>
  )
})
