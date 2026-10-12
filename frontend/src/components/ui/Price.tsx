import { discountPercent } from '../../features/catalog/catalogQuery'

type PriceProps = { price: number; compareAtPrice?: number | null; size?: 'sm' | 'md' | 'lg'; showSavings?: boolean }

const amount = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)

/** Selling price from ERPNext, with the struck-through compare-at price and saving when there is one. */
export function Price({ price, compareAtPrice = null, size = 'sm', showSavings = true }: PriceProps) {
  const off = discountPercent({ price, compareAtPrice })
  return (
    <div className={`sf-price sf-price-${size}`}>
      {off > 0 && showSavings && <span className="sf-price-off">-{off}%</span>}
      <span className="sf-price-now">
        <span className="sf-sr-only">Price </span>
        <sup aria-hidden="true">₹</sup>
        <span className="sf-sr-only">₹</span>
        {amount(price)}
      </span>
      {off > 0 && (
        <span className="sf-price-was">
          M.R.P. <s><span className="sf-sr-only">was </span>₹{amount(compareAtPrice!)}</s>
        </span>
      )}
    </div>
  )
}
