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

export function HomePage() {
  return (
    <main>
      <HeroSection />
      <div className="relative isolate flow-root bg-stone-50 dark:bg-stone-950">
        <NutDecorations />
        <BenefitsSection />
        <FavoritesSection />
      </div>
      <HoneySection />
      <HamperBanner />
      <TrendingSection />
      <GalleryStatsSection />
      <NewsletterSection />
      <TestimonialSection />
      <Footer />
    </main>
  )
}
