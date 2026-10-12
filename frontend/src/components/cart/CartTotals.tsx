import { AlertTriangle } from 'lucide-react'
import type { CartQuote } from '../../types/catalog'
import { formatMoney } from '../../utils/money'
import { Skeleton } from '../ui/Feedback'

type CartTotalsProps = { quote: CartQuote | undefined; isLoading: boolean; isError?: boolean; showShipping?: boolean }

/** Totals exactly as ERPNext calculated them for this cart (see bossco.api.get_cart_quote). */
export function CartTotals({ quote, isLoading, isError = false, showShipping = true }: CartTotalsProps) {
  if (isError || quote?.error) {
    return (
      <p className="sf-alert sf-alert-error" role="alert">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        {quote?.error ?? 'We couldn’t price your cart right now. Totals are confirmed at checkout.'}
      </p>
    )
  }
  if (!quote) {
    return isLoading ? (
      <div className="grid gap-3" aria-busy="true" aria-label="Updating totals">
        <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-6 w-full" />
      </div>
    ) : null
  }
  return (
    <dl className="sf-summary" aria-busy={isLoading} aria-live="polite" style={{ opacity: isLoading ? 0.6 : 1 }}>
      <div><dt>Subtotal ({quote.lines.reduce((sum, line) => sum + line.qty, 0)} items)</dt><dd>{formatMoney(quote.subtotal, quote.currency, 2)}</dd></div>
      {quote.discount > 0 && (
        <div className="is-discount"><dt>Discount{quote.coupon.applied && quote.coupon.code ? ` (${quote.coupon.code})` : ''}</dt><dd>−{formatMoney(quote.discount, quote.currency, 2)}</dd></div>
      )}
      {showShipping && <div><dt>Shipping</dt><dd>{quote.shipping ? formatMoney(quote.shipping, quote.currency) : 'Free'}</dd></div>}
      {quote.taxes > 0 && <div><dt>Taxes</dt><dd>{formatMoney(quote.taxes, quote.currency, 2)}</dd></div>}
      <div className="is-total"><dt>Order total</dt><dd>{formatMoney(quote.total, quote.currency, 2)}</dd></div>
    </dl>
  )
}
