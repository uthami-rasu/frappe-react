import { CheckCircle2, Tag, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setCouponCode } from '../../features/commerce/commerceSlice'
import type { CartQuote } from '../../types/catalog'

/** Coupon input. ERPNext decides whether the code applies (and why not); this only shows the answer. */
export function CouponField({ quote, isChecking }: { quote: CartQuote | undefined; isChecking: boolean }) {
  const dispatch = useAppDispatch()
  const applied = useAppSelector((state) => state.commerce.couponCode)
  // what the shopper is typing; starts over whenever the applied code changes
  const [draft, setDraft] = useState({ for: applied, value: applied })
  const value = draft.for === applied ? draft.value : applied
  const setValue = (next: string) => setDraft({ for: applied, value: next })
  const id = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (value.trim()) dispatch(setCouponCode(value))
  }
  const status = applied && quote?.coupon.code?.toUpperCase() === applied ? quote.coupon : null

  return (
    <div className="grid gap-2">
      <form className="flex gap-2" onSubmit={submit}>
        <label htmlFor={id} className="sf-sr-only">Coupon code</label>
        <div className="relative flex-1">
          <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sf-muted)]" aria-hidden="true" />
          <input
            id={id}
            className="sf-input !min-h-[42px] !pl-9 uppercase"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Coupon code"
            autoComplete="off"
            aria-invalid={Boolean(status && !status.applied)}
            aria-describedby={`${id}-status`}
          />
        </div>
        <button type="submit" className="sf-btn sf-btn-outline sf-btn-sm !min-h-[42px]" disabled={!value.trim() || isChecking}>Apply</button>
      </form>
      <div id={`${id}-status`} aria-live="polite">
        {applied && isChecking && <p className="sf-hint">Checking {applied}…</p>}
        {status?.applied && !isChecking && (
          <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-[var(--sf-success)]">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} /> {applied} applied</span>
            <button type="button" className="sf-link inline-flex items-center gap-1 text-xs" onClick={() => dispatch(setCouponCode(''))}><X size={12} /> Remove</button>
          </p>
        )}
        {status && !status.applied && !isChecking && (
          <p className="sf-error justify-between">
            <span>{status.message}</span>
            <button type="button" className="sf-link text-xs" onClick={() => dispatch(setCouponCode(''))}>Clear</button>
          </p>
        )}
      </div>
    </div>
  )
}
