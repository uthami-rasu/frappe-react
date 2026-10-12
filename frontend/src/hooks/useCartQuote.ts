import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '../app/hooks'
import { useGetCartQuoteQuery, useGetStorefrontConfigQuery } from '../features/api/storeApi'

const QUOTE_DELAY = 350

/**
 * The cart priced by ERPNext (prices, coupon, shipping, taxes), exactly as checkout will charge it.
 * Requests are debounced so a quantity stepper doesn't fire one quote per click.
 */
export function useCartQuote({ skip = false } = {}) {
  const cart = useAppSelector((state) => state.commerce.cart)
  const shippingMethod = useAppSelector((state) => state.commerce.shippingMethod)
  const couponCode = useAppSelector((state) => state.commerce.couponCode)

  const args = useMemo(
    () => ({
      items: cart.map((line) => ({ item_code: line.productId, qty: line.quantity })),
      shipping_method: shippingMethod,
      coupon_code: couponCode || undefined,
    }),
    [cart, shippingMethod, couponCode],
  )
  const [debounced, setDebounced] = useState(args)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(args), QUOTE_DELAY)
    return () => window.clearTimeout(timer)
  }, [args])

  const query = useGetCartQuoteQuery(debounced, { skip: skip || !debounced.items.length })
  const isStale = debounced !== args || query.isFetching
  return { ...query, quote: debounced.items.length ? query.data : undefined, isStale }
}

export function useStorefrontConfig() {
  const { data } = useGetStorefrontConfigQuery(undefined, { selectFromResult: ({ data }) => ({ data }) })
  return data
}
