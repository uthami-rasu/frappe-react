import type { Feature } from '../../types/feature'

type HoneyBenefitProps = {
  feature: Feature
  index: number
  side: 'left' | 'right'
}

export function HoneyBenefit({ feature, index, side }: HoneyBenefitProps) {
  const Icon = feature.icon

  return (
    <article className={`honey-fact honey-fact-${index + 1} group relative overflow-visible px-6 py-6 text-left ${side === 'right' ? 'lg:text-right' : ''}`} data-reveal>
      <span className={`mb-5 flex items-center gap-3 ${side === 'right' ? 'lg:flex-row-reverse' : ''}`}>
        <span className="grid size-11 place-items-center rounded-full bg-white/80 text-[#b97834] shadow-sm transition duration-500 group-hover:-translate-y-1 group-hover:rotate-6">
          <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#94704a]">Benefit 0{index + 1}</span>
      </span>
      <div className={side === 'right' ? 'lg:ml-auto' : ''}>
        <h3 className="max-w-[220px] font-display text-[1.55rem] font-bold leading-[.95] text-[#173f32] dark:text-stone-50">
          {feature.title}
        </h3>
        <p className="mt-3 max-w-[220px] text-xs leading-5 text-stone-600 dark:text-stone-400">
          {feature.description}
        </p>
      </div>
      <span className={`honey-connector absolute top-1/2 hidden w-10 border-t border-dashed border-[#c99c55]/60 lg:block ${side === 'left' ? '-right-8' : '-left-8'}`} />
    </article>
  )
}
