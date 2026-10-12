import heroImage from '../../assets/images/ChatGPT Image Jun 10, 2026, 11_08_40 AM 1.webp'
import { ArrowDown, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { preload } from 'react-dom'
import { ActionLink } from '../ui/ActionLink'

export function HeroSection() {
  // the hero background is the page's largest paint: start fetching it before CSS discovers it
  preload(heroImage, { as: 'image', fetchPriority: 'high' })
  return (
    <section
      className="hero-section relative isolate overflow-hidden bg-[#edc488]"
      id="home"
      style={{ backgroundImage: `url("${heroImage}")` }}
    >
      <div className="hero-overlay absolute inset-0 bg-gradient-to-r from-[#f3d6a5]/35 via-transparent to-transparent dark:from-stone-950/75 dark:via-stone-950/15" />
      <div className="hero-grain absolute inset-0 opacity-25" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] items-start px-5 pb-28 pt-14 sm:items-center sm:px-10 sm:py-12 lg:px-[7.5%]">
        <div className="hero-copy max-w-[550px]">
          <p className="hero-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#95602c] shadow-sm backdrop-blur-sm">
            <Sparkles size={13} fill="currentColor" /> Nature&apos;s finest, delivered
          </p>

          <h1 className="hero-reveal hero-delay-1 font-display text-[clamp(3.25rem,6vw,6.2rem)] font-bold leading-[0.82] tracking-[-0.055em] text-[#183e31] dark:text-white">
            Better snacks.
            <span className="mt-2 block italic text-white drop-shadow-[0_3px_2px_rgba(73,39,12,0.25)]">
              Naturally.
            </span>
          </h1>

          <p className="hero-reveal hero-delay-2 mt-6 max-w-[445px] text-[15px] leading-7 text-stone-700 dark:text-stone-100">
            Premium nuts, sun-dried fruits and honest ingredients—handpicked,
            freshly packed, and made for everyday feel-good snacking.
          </p>

          <div className="hero-reveal hero-delay-3 mt-7 flex flex-wrap gap-3">
            <ActionLink href="#favorites">Shop bestsellers</ActionLink>
            <ActionLink href="#favorites" variant="secondary">
              Explore all
            </ActionLink>
          </div>

          <div className="hero-reveal hero-delay-4 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-[#28483e] dark:text-stone-100">
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Quality tested</span>
            <span className="flex items-center gap-1.5"><Truck size={15} /> Pan-India delivery</span>
          </div>
        </div>
      </div>

      <a className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#244537] lg:flex" href="#favorites">
        Discover <ArrowDown className="scroll-nudge" size={17} />
      </a>
    </section>
  )
}
