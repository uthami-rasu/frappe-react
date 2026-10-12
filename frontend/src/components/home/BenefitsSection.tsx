import { benefits } from '../../constants/benefits'
import { BenefitCard } from './BenefitCard'

export function BenefitsSection() {
  return (
    <section className="relative z-20 -mt-16 px-5 sm:px-8" aria-label="Shopping benefits">
      <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4 xl:max-w-[1120px] xl:gap-8">
        {benefits.map((benefit) => (
          <BenefitCard key={benefit.title} {...benefit} />
        ))}
      </div>
    </section>
  )
}
