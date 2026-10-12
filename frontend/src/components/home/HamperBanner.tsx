import bannerImage from '../../assets/images/2507043fbfc4380fcfdea3c81abf8ab643a6c6b5.webp'
import rightNuts from '../../assets/images/ChatGPT Image Jun 12, 2026, 04_05_10 PM 3.webp'
import leftNuts from '../../assets/images/ChatGPT Image Jun 12, 2026, 04_05_10 PM 4.webp'
import { ActionLink } from '../ui/ActionLink'

export function HamperBanner() {
  return (
    <section className="bg-white px-5 pb-24 dark:bg-stone-950 sm:px-8">
      <div
        className="hamper-card relative mx-auto flex min-h-[340px] max-w-[1180px] items-center justify-center overflow-hidden rounded-[32px] bg-[#aeb7a2] bg-cover bg-center px-6 py-14 text-center shadow-[0_30px_70px_rgba(45,65,39,.16)] sm:min-h-[380px]"
        data-reveal
      >
        <div className="hamper-parallax-bg absolute -inset-10 bg-cover bg-center" style={{ backgroundImage: `url("${bannerImage}")` }} />
        <div className="absolute inset-0 bg-[#84916d]/10 dark:bg-stone-950/20" />
        <img
          className="hamper-nuts-left pointer-events-none absolute -bottom-36 -left-9 w-[185px] select-none sm:-bottom-48 sm:w-[260px] lg:-bottom-64 lg:w-[350px]"
          src={leftNuts}
          alt=""
          aria-hidden="true"
        />
        <img
          className="hamper-nuts-right pointer-events-none absolute -right-8 -top-24 w-[205px] select-none sm:-top-32 sm:w-[285px] lg:-top-44 lg:w-[390px]"
          src={rightNuts}
          alt=""
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-white drop-shadow-sm sm:text-sm">
            Celebrate every moment with Bossco&apos;s nut hampers
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.25rem)] font-bold leading-[0.95] tracking-[-0.035em] text-[#263710]">
            A Crunchy Delight for
            <br />
            Your Loved Ones!
          </h2>
          <div className="mt-7 flex justify-center">
            <ActionLink href="#favorites" showArrow={false}>
              Shop Now
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  )
}
