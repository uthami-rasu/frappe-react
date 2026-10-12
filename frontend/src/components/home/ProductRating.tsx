import { Star } from 'lucide-react'

type ProductRatingProps = {
  rating: number
  reviews: number
}

/** One star and the score, rather than five identical stars on every card. */
export function ProductRating({ rating, reviews }: ProductRatingProps) {
  if (!reviews) return <span className="text-[10px] font-semibold leading-none text-stone-400">New · no reviews yet</span>
  return (
    <span className="flex items-center gap-1.5" aria-label={`${rating.toFixed(1)} out of 5 stars, ${reviews} ${reviews === 1 ? 'review' : 'reviews'}`}>
      <Star aria-hidden="true" className="fill-[#dda23f] text-[#dda23f]" size={12} strokeWidth={1.5} />
      <span className="text-[11px] font-bold leading-none text-[#173f32] dark:text-stone-200">{rating.toFixed(1)}</span>
      <span className="text-[10px] leading-none text-stone-400">({reviews})</span>
    </span>
  )
}
