import honeyImage from '../../assets/images/8773eeca3cba18ea1f474f415ed58dd51b2c77ee.webp'
import {
  leftHoneyBenefits,
  rightHoneyBenefits,
} from '../../constants/honeyBenefits'
import { ActionLink } from '../ui/ActionLink'
import { HoneyBenefitColumn } from './HoneyBenefitColumn'
import { NatureFlyer } from './NatureFlyer'
import { useRef } from 'react'
import { useSectionParallax } from '../../hooks/useSectionParallax'
import beeImage from '../../assets/images/nature-bee-3d.webp'
import butterflyImage from '../../assets/images/nature-butterfly-3d.webp'
import botanicalImage from '../../assets/images/nature-botanical-3d.webp'

export function HoneySection() {
  const sectionRef = useRef<HTMLElement>(null)
  useSectionParallax(sectionRef)

  return (
    <section
      ref={sectionRef}
      className="honey-scroll-stage relative z-30 -mt-2"
      id="honey"
    >
      <div className="honey-depth-panel honey-stage relative isolate overflow-hidden bg-white px-5 pb-20 pt-7 shadow-[0_-28px_70px_rgba(40,54,44,.14)] dark:bg-stone-950 sm:px-8 sm:pt-9 lg:pb-24">
      <div className="honey-parallax-glow absolute left-1/2 top-1/2 -z-10 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff2c9] blur-3xl dark:bg-amber-900/10" />
      <div className="honeycomb-pattern absolute inset-0 -z-10 opacity-30" />
      <div className="nature-scene absolute inset-0 overflow-hidden" aria-hidden="true">
        <img className="nature-plant nature-plant-left" src={botanicalImage} alt="" loading="lazy" decoding="async" />
        <img className="nature-plant nature-plant-right" src={botanicalImage} alt="" loading="lazy" decoding="async" />
        <NatureFlyer kind="bee" flight="flight-bee-orbit" src={beeImage} />
        <NatureFlyer kind="bee" flight="flight-bee-left" src={beeImage} />
        <NatureFlyer kind="bee" flight="flight-bee-right" src={beeImage} />
        <NatureFlyer kind="butterfly" flight="flight-butterfly-left" src={butterflyImage} />
        <NatureFlyer kind="butterfly" flight="flight-butterfly-right" src={butterflyImage} />
      </div>
      <div className="honey-ambient honey-ambient-one" aria-hidden="true"><span /><span /><span /></div>
      <div className="honey-ambient honey-ambient-two" aria-hidden="true"><span /><span /></div>
      <header className="mx-auto max-w-4xl text-center" data-reveal>
        <p className="eyebrow">
          100% raw • single origin
        </p>
        <h2 className="mt-4 font-display text-[clamp(2.65rem,4.7vw,4.6rem)] font-bold leading-[.9] tracking-[-0.045em] text-[#173f32] dark:text-stone-50">
          Golden by nature.
          <span className="honey-script mt-1 block italic text-[#d49a36]">Pure by choice.</span>
        </h2>
        <p className="mx-auto mt-7 max-w-[680px] text-[15px] leading-7 text-stone-500 dark:text-stone-400">
          Slowly collected from trusted apiaries and bottled without shortcuts.
          Rich aroma, honest sweetness, and nature&apos;s goodness in every golden spoonful.
        </p>
      </header>

      <div className="mx-auto mt-10 grid max-w-[1180px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_410px_1fr] lg:gap-9">
        <div className="order-2 lg:order-none">
          <HoneyBenefitColumn features={leftHoneyBenefits} side="left" startIndex={0} />
        </div>

        <div className="order-1 flex flex-col items-center lg:order-none" data-reveal>
          <span className="mb-2 rounded-full border border-[#dfbe71]/40 bg-[#fff8dc] px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#97692e]">Single origin • raw</span>
          <div className="honey-parallax-product w-full text-center">
            <img
              className="honey-float mx-auto h-[390px] w-full max-w-[390px] object-contain drop-shadow-[0_30px_30px_rgba(91,57,10,.18)] sm:h-[430px]"
              src={honeyImage}
              alt="Two jars of pure natural honey on a wooden base"
              loading="lazy"
            />
          </div>
          <div className="-mt-2">
            <ActionLink href="#favorites">Explore Honey Collection</ActionLink>
          </div>
        </div>

        <div className="order-3 lg:order-none">
          <HoneyBenefitColumn features={rightHoneyBenefits} side="right" startIndex={2} />
        </div>
      </div>
      </div>
    </section>
  )
}
