import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAppDispatch } from '../../app/hooks'
import { setCouponCode } from '../../features/commerce/commerceSlice'

const toDate = (value: string) => new Date(value.replace(' ', 'T'))

/** "Ends in 5h 12m" when close, otherwise "Ends 11 Nov"; nothing for open-ended offers. */
export function OfferExpiry({ expiresAt }: { expiresAt: string | null }) {
  const [now, setNow] = useState(() => Date.now())
  const end = expiresAt ? toDate(expiresAt).getTime() : null
  const soon = end !== null && end - now < 48 * 3600 * 1000
  useEffect(() => {
    if (!soon) return
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [soon])
  if (end === null) return null
  if (end <= now) return <span className="sf-countdown">Ended</span>
  if (!soon) return <span className="sf-countdown">Ends {toDate(expiresAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
  const minutes = Math.floor((end - now) / 60000)
  return <span className="sf-countdown">Ends in {Math.floor(minutes / 60)}h {minutes % 60}m</span>
}

/** The coupon code with copy and one-tap apply (ERPNext still validates it at checkout). */
export function OfferCode({ code }: { code: string }) {
  const dispatch = useAppDispatch()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked: applying still works
    }
    dispatch(setCouponCode(code))
    toast.success(`Coupon ${code} added to your cart`, { description: 'Its discount is checked and applied at checkout.' })
  }
  return (
    <span className="sf-offer-code">
      <span aria-label={`Coupon code ${code.split('').join(' ')}`}>{code}</span>
      <button type="button" onClick={copy} aria-label={`Copy and apply coupon ${code}`}>
        {copied ? <Check size={12} className="inline" /> : <Copy size={12} className="inline" />} {copied ? 'Applied' : 'Use code'}
      </button>
    </span>
  )
}
