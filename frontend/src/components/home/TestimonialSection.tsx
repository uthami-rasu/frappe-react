import { useState } from 'react'
import ovalImage from '../../assets/images/Component 1.webp'
import { testimonials } from '../../constants/testimonials'
import type { Testimonial } from '../../types/testimonial'
import { TestimonialThumbnail } from './TestimonialThumbnail'

export function TestimonialSection() {
  const [active, setActive] = useState<Testimonial>(testimonials[0])
  const thumbnails = testimonials.filter((item) => item.id !== active.id)

  return (
    <section className="testimonial-stage relative overflow-hidden bg-white px-5 pb-28 pt-24 dark:bg-stone-950 sm:px-8" id="testimonials">
      <div className="absolute right-0 top-0 font-display text-[18rem] font-bold leading-none text-[#f5eee2] dark:text-stone-900">“</div>
      <div className="relative mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[140px_360px_1fr] lg:gap-8" data-reveal>
        <div className="flex items-center justify-center lg:flex-col lg:justify-between">
          <div className="relative flex w-full items-center justify-center gap-3 py-5 lg:h-[250px] lg:w-[110px] lg:py-0">
            <img className="absolute inset-0 hidden h-full w-full object-contain lg:block" src={ovalImage} alt="" aria-hidden="true" />
            <span className="relative font-display text-4xl font-semibold text-stone-950 dark:text-stone-50 lg:[writing-mode:vertical-rl] lg:rotate-180 lg:font-sans">
              Testimonial
            </span>
            <span className="font-display text-6xl font-bold leading-none text-[#dfb37d] lg:absolute lg:-right-14 lg:top-4 lg:text-8xl">“</span>
          </div>
          <div className="hidden w-full lg:block">
            <TestimonialThumbnail testimonial={thumbnails[0]} onSelect={setActive} />
          </div>
        </div>

        <img
          className="h-[420px] w-full rounded-[150px_150px_28px_28px] object-cover shadow-[0_25px_60px_rgba(40,28,18,.15)] sm:h-[560px] lg:h-[590px]"
          src={active.image}
          alt={active.name}
        />

        <div className="flex flex-col justify-between gap-12 py-2">
          <div>
            <p className="text-3xl font-bold text-stone-950 dark:text-stone-50">#{active.id}</p>
            <h2 className="mt-5 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold uppercase text-stone-900 dark:text-stone-100">
              {active.name}
            </h2>
            <p className="mt-7 max-w-[560px] text-base leading-7 text-stone-600 dark:text-stone-400">
              {active.quote}
            </p>
          </div>
          <div className="hidden grid-cols-3 gap-5 lg:grid">
            {thumbnails.slice(1).map((testimonial) => (
              <TestimonialThumbnail
                testimonial={testimonial}
                onSelect={setActive}
                key={testimonial.id}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:hidden">
          {thumbnails.map((testimonial) => (
            <TestimonialThumbnail
              testimonial={testimonial}
              onSelect={setActive}
              key={testimonial.id}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
