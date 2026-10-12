import { Star } from 'lucide-react'

type ProductRatingProps = {
  reviews: number
}

/** One star and the score, rather than five identical stars on every card. */
export function ProductRating({ reviews }: ProductRatingProps) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`5 out of 5 stars, ${reviews} reviews`}>
      <Star aria-hidden="true" className="fill-[#dda23f] text-[#dda23f]" size={12} strokeWidth={1.5} />
      <span className="text-[11px] font-bold leading-none text-[#173f32] dark:text-stone-200">5.0</span>
      <span className="text-[10px] leading-none text-stone-400">({reviews})</span>
    </span>
  )
}
