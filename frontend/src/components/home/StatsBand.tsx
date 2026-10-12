import { brandStats } from '../../constants/brandStats'
import { CountUp } from '../ui/CountUp'

export function StatsBand() {
  return (
    <div className="stats-band relative overflow-hidden bg-[#173f32] px-5 py-20 text-white sm:px-8">
      <div className="absolute -left-20 -top-20 size-64 rounded-full border border-white/10" />
      <div className="absolute -bottom-36 right-[10%] size-80 rounded-full border border-[#d5ad68]/20" />
      <dl className="relative mx-auto grid max-w-[1000px] grid-cols-2 gap-10 text-center lg:grid-cols-4">
        {brandStats.map((stat, index) => (
          <div className="stat-item relative" key={stat.label} data-reveal>
            <dt className="text-[clamp(2.3rem,4vw,3.35rem)] font-bold leading-none">
              <span className="mb-4 inline-grid size-7 place-items-center rounded-full border border-[#d5ad68]/40 text-[10px] text-[#e7c88d]" aria-hidden="true">0{index + 1}</span>
              <CountUp value={stat.value} />
            </dt>
            <dd className="mt-3 text-xs text-stone-300">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
