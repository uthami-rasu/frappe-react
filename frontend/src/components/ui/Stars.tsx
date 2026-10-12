import { Star } from 'lucide-react'

type StarsProps = { value: number; size?: number; className?: string }

/** Five stars filled to `value` (0–5), including partial stars. Decorative: pair it with text. */
export function Stars({ value, size = 14, className = '' }: StarsProps) {
  const percent = Math.max(0, Math.min(5, value)) * 20
  const row = Array.from({ length: 5 }, (_, index) => <Star key={index} size={size} fill="currentColor" strokeWidth={0} />)
  return (
    <span className={`sf-stars ${className}`} aria-hidden="true">
      {row}
      <span className="sf-stars-fill" style={{ width: `${percent}%` }}>{row}</span>
    </span>
  )
}

type RatingProps = { rating: number; reviews: number; href?: string; size?: number; compact?: boolean }

/** "★★★★☆ 4.2 (18)", or "No reviews yet" when nobody has reviewed the product. */
export function Rating({ rating, reviews, href, size = 14, compact = false }: RatingProps) {
  if (!reviews) return <span className="sf-rating text-[12.5px] text-[var(--sf-muted)]">No reviews yet</span>
  const label = `${rating.toFixed(1)} out of 5 stars, ${reviews} ${reviews === 1 ? 'review' : 'reviews'}`
  const count = <span>({reviews.toLocaleString('en-IN')})</span>
  return (
    <span className="sf-rating" aria-label={label} role="img">
      <Stars value={rating} size={size} />
      {!compact && <b aria-hidden="true">{rating.toFixed(1)}</b>}
      {href ? <a href={href} aria-hidden="true" tabIndex={-1}>{count}</a> : <span aria-hidden="true">{count}</span>}
    </span>
  )
}
