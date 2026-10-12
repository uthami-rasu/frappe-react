import { CreditCard, Smartphone, Truck } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { PaymentMethod } from '../../types/catalog'

const methods: Array<{ id: PaymentMethod; label: string; hint: string; icon: typeof Truck }> = [
  { id: 'cod', label: 'Cash on delivery', hint: 'Pay when your order arrives', icon: Truck },
  { id: 'card', label: 'Credit / debit card', hint: 'Test mode — no real charge', icon: CreditCard },
  { id: 'upi', label: 'UPI', hint: 'Test mode — no real charge', icon: Smartphone },
]

// 4242424242424242 → "4242 4242 4242 4242"; 1230 → "12/30"
const formatCardNumber = (event: ChangeEvent<HTMLInputElement>) => {
  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
}
const formatExpiry = (event: ChangeEvent<HTMLInputElement>) => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
  event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function PaymentSection({ method, onChange }: { method: PaymentMethod; onChange: (method: PaymentMethod) => void }) {
  return (
    <section className="shadow-md">
      <h2>Payment</h2>
      <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label="Payment method">
        {methods.map(({ id, label, hint, icon: Icon }) => (
          <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${method === id ? 'border-[#527d49] bg-[#f3f7f0]' : 'border-[#d3cfc7] hover:border-[#a9b7a2]'}`}>
            <input type="radio" name="payment_method" value={id} checked={method === id} onChange={() => onChange(id)} />
            <Icon size={18} className="text-[#527d49]" />
            <span className="flex-1">
              <b className="block text-sm text-stone-800">{label}</b>
              <small className="text-xs text-stone-500">{hint}</small>
            </span>
          </label>
        ))}
      </div>

      {method === 'card' && (
        <div className="form-grid">
          <label className="span-2">
            NAME ON CARD
            <input required name="card_name" autoComplete="cc-name" placeholder="As printed on the card" />
          </label>
          <label className="span-2">
            CARD NUMBER
            <input required name="card_number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" onChange={formatCardNumber} />
          </label>
          <label>
            EXPIRY (MM/YY)
            <input required name="card_expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="12/30" onChange={formatExpiry} />
          </label>
          <label>
            CVC
            <input required name="card_cvc" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="123" />
          </label>
        </div>
      )}

      {method === 'upi' && (
        <div className="form-grid">
          <label className="span-2">
            UPI ID
            <input required name="upi_id" autoComplete="off" placeholder="yourname@okbank" />
          </label>
        </div>
      )}

      {method !== 'cod' && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          Mock payment gateway: any valid-looking card or UPI ID succeeds. Use card <b>4000 0000 0000 0002</b> or UPI <b>fail@upi</b> to test a declined payment.
        </p>
      )}
    </section>
  )
}
