import { toast } from 'sonner'
import { ChevronDown, PackageOpen, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useAppDispatch } from '../../app/hooks'
import { useGetOrdersQuery } from '../../features/api/storeApi'
import { addToCart } from '../../features/commerce/commerceSlice'
import type { CatalogProduct } from '../../types/catalog'
import type { Order, OrderStatus } from '../../types/account'
import { formatDate, formatMoney } from '../../utils/money'

const statusClass: Record<OrderStatus, string> = {
  'Awaiting confirmation': 'bg-amber-50 text-amber-800',
  Processing: 'bg-sky-50 text-sky-800',
  'Partly shipped': 'bg-indigo-50 text-indigo-800',
  Delivered: 'bg-emerald-50 text-emerald-800',
  'On hold': 'bg-stone-100 text-stone-700',
  Cancelled: 'bg-red-50 text-red-700',
}

export function OrderHistory({ products }: { products: CatalogProduct[] }) {
  const { data: orders = [], isLoading, isError } = useGetOrdersQuery()
  const [expanded, setExpanded] = useState<string | null>(null)
  const dispatch = useAppDispatch()

  const buyAgain = (order: Order) => {
    const available = order.items.filter((item) => products.some((product) => product.id === item.itemCode && product.inStock))
    available.forEach((item) => {
      const product = products.find((p) => p.id === item.itemCode)!
      dispatch(addToCart({ productId: item.itemCode, quantity: item.qty, weight: product.size }))
    })
    if (available.length) {
      toast.success('Added to cart! 🛒', { description: `${available.length} item${available.length > 1 ? 's' : ''} from ${order.name}` })
      window.location.assign('#cart')
    } else {
      toast.info('These products are no longer available')
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-[#e2ded5] rounded-xl p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-stone-900 mb-8">Order History</h2>
      {isLoading ? (
        <p className="text-sm text-stone-500">Loading your orders…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Could not load your orders. Please refresh the page.</p>
      ) : orders.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-stone-300 py-12 text-center text-sm text-stone-500">
          <PackageOpen className="text-[#D9B27C]" size={28} />
          You haven't placed any orders yet.
          <a href="#honey" className="rounded-full bg-[#173f32] px-5 py-2 text-xs font-bold text-white">Start shopping</a>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {orders.map((order) => {
            const isOpen = expanded === order.name
            const [first, ...rest] = order.items
            return (
              <li key={order.name} className="py-4">
                <button type="button" onClick={() => setExpanded(isOpen ? null : order.name)} className="flex w-full items-center gap-4 text-left" aria-expanded={isOpen}>
                  {first?.image && <img src={first.image} alt="" className="w-14 h-14 shrink-0 rounded-lg object-cover border border-stone-200" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-stone-900 text-sm">{first?.itemName}{rest.length > 0 && <span className="font-normal text-stone-400"> + {rest.length} more</span>}</span>
                    <span className="block text-xs text-stone-400">#{order.name} · {formatDate(order.date)}</span>
                  </span>
                  <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline ${statusClass[order.status]}`}>{order.status}</span>
                  <span className="w-24 text-right font-bold text-stone-900 text-sm">{formatMoney(order.total, order.currency)}</span>
                  <ChevronDown size={16} className={`shrink-0 text-stone-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="mt-4 rounded-xl bg-[#FBF8F5] p-4 text-sm">
                    <span className={`mb-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold sm:hidden ${statusClass[order.status]}`}>{order.status}</span>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.itemCode} className="flex items-center justify-between gap-3">
                          <span className="text-stone-700">{item.itemName} <span className="text-stone-400">× {item.qty}</span></span>
                          <span className="font-semibold text-stone-800">{formatMoney(item.amount, order.currency)}</span>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-4 grid gap-2 border-t border-stone-200 pt-3 text-xs text-stone-600 sm:grid-cols-2">
                      <div><dt className="font-bold uppercase tracking-wider text-stone-400">Payment</dt><dd>{order.paymentMethod} · {order.paid ? <b className="text-emerald-700">Paid</b> : 'Pay on delivery'}{order.paymentReference && <span className="block text-stone-400">Ref {order.paymentReference}</span>}</dd></div>
                      <div><dt className="font-bold uppercase tracking-wider text-stone-400">Delivering to</dt><dd>{order.shippingAddress || '—'}</dd></div>
                    </dl>
                    <button type="button" onClick={() => buyAgain(order)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#D9B27C] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#c9a068]"><RotateCcw size={13} /> Buy again</button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
