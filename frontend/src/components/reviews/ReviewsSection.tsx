import { BadgeCheck, MessageSquarePlus, Star, ThumbsUp } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useGetReviewsQuery, useSubmitReviewMutation, useVoteHelpfulMutation } from '../../features/api/storeApi'
import type { CatalogProduct, Review, ReviewPage, ReviewSort, ReviewViewer } from '../../types/catalog'
import { formatDate } from '../../utils/money'
import { EmptyState, ErrorState, Skeleton } from '../ui/Feedback'
import { Stars } from '../ui/Stars'

const PAGE = 10
const SORTS: Record<ReviewSort, string> = { helpful: 'Most helpful', newest: 'Newest', highest: 'Highest rating', lowest: 'Lowest rating' }

function RatingInput({ value, onChange, invalid }: { value: number; onChange: (value: number) => void; invalid: boolean }) {
  const name = useId()
  const [hover, setHover] = useState(0)
  const labels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent']
  return (
    <fieldset>
      <legend className="sf-label mb-1">Overall rating <span aria-hidden="true">*</span></legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(star)}>
            <input type="radio" name={name} value={star} checked={value === star} onChange={() => onChange(star)} className="sf-sr-only" aria-invalid={invalid} />
            <Star size={28} strokeWidth={1.5} className={(hover || value) >= star ? 'fill-[var(--sf-star)] text-[var(--sf-star)]' : 'text-[var(--sf-line-strong)]'} aria-hidden="true" />
            <span className="sf-sr-only">{star} star{star > 1 ? 's' : ''}, {labels[star - 1]}</span>
          </label>
        ))}
        <span className="ml-2 text-sm font-semibold text-[var(--sf-ink-soft)]" aria-hidden="true">{labels[(hover || value) - 1] ?? ''}</span>
      </div>
    </fieldset>
  )
}

function ReviewForm({ product, viewer, onDone }: { product: CatalogProduct; viewer: ReviewViewer; onDone: () => void }) {
  const mine = viewer.myReview
  const [rating, setRating] = useState(mine?.rating ?? 0)
  const [title, setTitle] = useState(mine?.title ?? '')
  const [comment, setComment] = useState(mine?.comment ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submit, { isLoading }] = useSubmitReviewMutation()
  const id = useId()

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!rating) next.rating = 'Choose a star rating'
    if (comment.trim().length < 10) next.comment = 'Write at least 10 characters'
    if (title.length > 120) next.title = 'Keep the title under 120 characters'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const result = await submit({ item_code: product.id, rating, title: title.trim(), comment: comment.trim() }).unwrap()
      toast.success(result.message)
      onDone()
    } catch (error) {
      toast.error('Could not submit your review', { description: typeof error === 'string' ? error : undefined })
    }
  }

  return (
    <form className="sf-card grid gap-4 p-5" onSubmit={onSubmit} noValidate aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="text-lg font-bold">{mine ? 'Edit your review' : 'Write a review'}</h3>
      {viewer.verifiedPurchase && <p className="sf-alert sf-alert-success !py-2 text-[13px]"><BadgeCheck size={16} /> Your review will show a Verified Purchase badge.</p>}
      <div>
        <RatingInput value={rating} onChange={setRating} invalid={Boolean(errors.rating)} />
        {errors.rating && <p className="sf-error mt-1" role="alert">{errors.rating}</p>}
      </div>
      <div className="sf-field">
        <label className="sf-label" htmlFor={`${id}-headline`}>Headline <span className="font-normal text-[var(--sf-muted)]">(optional)</span></label>
        <input id={`${id}-headline`} className="sf-input" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="What’s most important to know?" aria-invalid={Boolean(errors.title)} />
      </div>
      <div className="sf-field">
        <label className="sf-label" htmlFor={`${id}-comment`}>Your review <span aria-hidden="true">*</span></label>
        <textarea id={`${id}-comment`} className="sf-input" value={comment} maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="What did you like or dislike? How did you use it?" aria-invalid={Boolean(errors.comment)} aria-describedby={`${id}-count`} required />
        <div className="flex justify-between">
          {errors.comment ? <p className="sf-error" role="alert">{errors.comment}</p> : <span />}
          <span id={`${id}-count`} className="sf-hint">{comment.length}/2000</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="sf-btn sf-btn-primary" disabled={isLoading}>{isLoading ? 'Submitting…' : mine ? 'Update review' : 'Submit review'}</button>
        <button type="button" className="sf-btn sf-btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

function ReviewItem({ review, itemCode, loggedIn }: { review: Review; itemCode: string; loggedIn: boolean }) {
  const [vote, { isLoading }] = useVoteHelpfulMutation()
  const toggle = async () => {
    if (!loggedIn) {
      toast.info('Sign in to vote on reviews')
      return
    }
    try {
      await vote({ review: review.id, helpful: review.votedHelpful ? 0 : 1, item_code: itemCode }).unwrap()
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Could not record your vote')
    }
  }
  return (
    <article className="border-b border-[var(--sf-line)] py-5 last:border-0" aria-label={`Review by ${review.author}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-[var(--sf-surface-alt)] text-sm font-bold text-[var(--sf-ink-soft)]" aria-hidden="true">{review.author[0]}</span>
        <b className="text-sm">{review.author}</b>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span role="img" aria-label={`${review.rating} out of 5 stars`}><Stars value={review.rating} size={15} /></span>
        {review.title && <h4 className="text-[15px] font-bold">{review.title}</h4>}
      </div>
      <p className="mt-1 text-[13px] text-[var(--sf-muted)]">
        Reviewed on {formatDate(review.date)}
        {review.verifiedPurchase && <span className="ml-2 inline-flex items-center gap-1 font-bold text-[var(--sf-deal)]"><BadgeCheck size={14} /> Verified Purchase</span>}
      </p>
      <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-[var(--sf-ink)]">{review.comment}</p>
      <div className="mt-3 flex items-center gap-3">
        {review.helpful > 0 && <span className="sf-hint">{review.helpful} {review.helpful === 1 ? 'person' : 'people'} found this helpful</span>}
        <button type="button" className={`sf-btn sf-btn-outline sf-btn-sm ${review.votedHelpful ? '!border-[var(--sf-brand)]' : ''}`} onClick={toggle} disabled={isLoading} aria-pressed={review.votedHelpful}>
          <ThumbsUp size={13} /> Helpful
        </button>
      </div>
    </article>
  )
}

function ReviewChunk({ itemCode, sort, rating, start, loggedIn, onLoaded }: { itemCode: string; sort: ReviewSort; rating: number; start: number; loggedIn: boolean; onLoaded?: (page: ReviewPage) => void }) {
  const { data, isFetching, isError, refetch } = useGetReviewsQuery({ item_code: itemCode, sort, start, limit: PAGE, rating: rating || undefined })
  useEffect(() => {
    if (data) onLoaded?.(data)
  }, [data, onLoaded])
  if (isError) return <ErrorState title="Couldn’t load reviews" onRetry={() => void refetch()} />
  if (!data) return isFetching ? <div className="grid gap-3 py-4" aria-busy="true"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-16 w-full" /></div> : null
  return <>{data.reviews.map((review) => <ReviewItem key={review.id} review={review} itemCode={itemCode} loggedIn={loggedIn} />)}</>
}

/** Ratings and reviews stored in Frappe (Storefront Review). */
export function ReviewsSection({ product, signInHref }: { product: CatalogProduct; signInHref: string }) {
  const [sort, setSort] = useState<ReviewSort>('helpful')
  const [rating, setRating] = useState(0)
  const [pages, setPages] = useState(1)
  const [writing, setWriting] = useState(false)
  const [lastPage, setLastPage] = useState<ReviewPage | null>(null)
  const { data: first, isLoading } = useGetReviewsQuery({ item_code: product.id, sort, start: 0, limit: PAGE, rating: rating || undefined })
  const summary = first?.summary
  const viewer = first?.viewer
  const filterBy = (star: number) => { setRating(rating === star ? 0 : star); setPages(1) }

  return (
    <section id="reviews" className="grid gap-8 lg:grid-cols-[320px_1fr]" aria-labelledby="reviews-title" style={{ scrollMarginTop: 150 }}>
      <div>
        <h2 id="reviews-title" className="sf-section-title !text-[1.9rem]">Customer reviews</h2>
        {isLoading || !summary ? (
          <div className="mt-4 grid gap-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-28 w-full" /></div>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-2">
              <Stars value={summary.average} size={20} />
              <b className="text-lg">{summary.total ? `${summary.average.toFixed(1)} out of 5` : 'No ratings yet'}</b>
            </div>
            <p className="sf-hint mt-1">{summary.total.toLocaleString('en-IN')} {summary.total === 1 ? 'rating' : 'ratings'}</p>
            {summary.total > 0 && (
              <div className="sf-bars mt-4" role="group" aria-label="Filter reviews by star rating">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution[String(star) as '1']
                  const percent = summary.total ? Math.round((count / summary.total) * 100) : 0
                  return (
                    <button key={star} type="button" className="sf-bar" onClick={() => filterBy(star)} disabled={!count} aria-pressed={rating === star} aria-label={`${star} star: ${percent}% (${count} reviews)`}>
                      <span className={rating === star ? 'font-bold text-[var(--sf-ink)]' : 'sf-link'}>{star} star</span>
                      <span className="sf-bar-track"><i style={{ width: `${percent}%` }} /></span>
                      <span className="text-right">{percent}%</span>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="mt-6 border-t border-[var(--sf-line)] pt-5">
              <h3 className="text-base font-bold">Review this product</h3>
              <p className="sf-hint mt-1">Share your thoughts with other customers.</p>
              {!viewer?.loggedIn ? (
                <a className="sf-btn sf-btn-outline sf-btn-block mt-3" href={signInHref}>Sign in to write a review</a>
              ) : viewer.canReview ? (
                <button type="button" className="sf-btn sf-btn-outline sf-btn-block mt-3" onClick={() => setWriting(true)}>
                  <MessageSquarePlus size={16} /> {viewer.myReview ? 'Edit your review' : 'Write a customer review'}
                </button>
              ) : (
                <p className="sf-alert sf-alert-info mt-3 text-[13px]">{viewer.reason}</p>
              )}
              {viewer?.myReview?.status === 'Pending' && <p className="sf-hint mt-2">Your review is waiting for approval.</p>}
            </div>
          </>
        )}
      </div>

      <div className="min-w-0">
        {writing && viewer && <div className="mb-6"><ReviewForm product={product} viewer={viewer} onDone={() => setWriting(false)} /></div>}
        {summary && summary.total > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">{rating ? `${rating}-star reviews` : 'Top reviews'}{rating ? <button type="button" className="sf-link ml-3 text-sm" onClick={() => filterBy(rating)}>Show all</button> : null}</h3>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[var(--sf-muted)]">Sort</span>
              <select className="sf-select" value={sort} onChange={(event) => { setSort(event.target.value as ReviewSort); setPages(1) }}>
                {(Object.keys(SORTS) as ReviewSort[]).map((key) => <option key={key} value={key}>{SORTS[key]}</option>)}
              </select>
            </label>
          </div>
        )}
        {summary && summary.total === 0 && !writing ? (
          <EmptyState icon={<Star size={24} />} title="No reviews yet" headingLevel={3}>
            {product.name} hasn’t been reviewed yet. Bought it? Tell other customers what you think.
          </EmptyState>
        ) : (
          <div aria-live="polite">
            {Array.from({ length: pages }, (_, index) => (
              <ReviewChunk
                key={`${sort}-${rating}-${index}`}
                itemCode={product.id}
                sort={sort}
                rating={rating}
                start={index * PAGE}
                loggedIn={Boolean(viewer?.loggedIn)}
                onLoaded={index === pages - 1 ? setLastPage : undefined}
              />
            ))}
            {lastPage?.hasMore && <button type="button" className="sf-btn sf-btn-outline mt-4" onClick={() => setPages((count) => count + 1)}>Show more reviews</button>}
          </div>
        )}
      </div>
    </section>
  )
}
