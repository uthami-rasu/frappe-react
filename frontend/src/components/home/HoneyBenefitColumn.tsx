import type { Feature } from '../../types/feature'
import { HoneyBenefit } from './HoneyBenefit'

type HoneyBenefitColumnProps = {
  features: Feature[]
  side: 'left' | 'right'
  startIndex: number
}

export function HoneyBenefitColumn({ features, side, startIndex }: HoneyBenefitColumnProps) {
  return (
    <div className="flex flex-col justify-around gap-10 lg:min-h-[430px] lg:gap-20">
      {features.map((feature, index) => (
        <HoneyBenefit feature={feature} index={startIndex + index} side={side} key={feature.title} />
      ))}
    </div>
  )
}
