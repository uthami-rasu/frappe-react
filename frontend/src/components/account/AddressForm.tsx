import type { FormEvent } from 'react'
import type { Address, AddressInput } from '../../types/account'

type AddressFormProps = {
  address?: Address
  isSaving: boolean
  onSave: (address: AddressInput) => void
  onCancel: () => void
}

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1'

export function AddressForm({ address, isSaving, onSave, onCancel }: AddressFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    onSave({
      name: address?.name,
      address_type: field('address_type'),
      address_line1: field('address_line1'),
      address_line2: field('address_line2'),
      city: field('city'),
      state: field('state'),
      pincode: field('pincode'),
      country: field('country'),
      phone: field('phone'),
      is_shipping_address: form.get('is_shipping_address') ? 1 : 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border-2 border-[#E6C594] bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-bold text-[#a36932]">{address ? 'Edit address' : 'New address'}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="address-line1">Street address *</label>
          <input id="address-line1" name="address_line1" required defaultValue={address?.address_line1} className="account-input" autoComplete="address-line1" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="address-line2">Apartment, landmark</label>
          <input id="address-line2" name="address_line2" defaultValue={address?.address_line2 ?? ''} className="account-input" autoComplete="address-line2" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address-city">Town / City *</label>
          <input id="address-city" name="city" required defaultValue={address?.city} className="account-input" autoComplete="address-level2" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address-state">State *</label>
          <input id="address-state" name="state" required defaultValue={address?.state} className="account-input" autoComplete="address-level1" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address-pincode">PIN / ZIP code *</label>
          <input id="address-pincode" name="pincode" required defaultValue={address?.pincode} className="account-input" autoComplete="postal-code" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address-country">Country *</label>
          <select id="address-country" name="country" required defaultValue={address?.country ?? 'India'} className="account-input">
            <option value="India">India</option>
            <option value="United States">United States</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="address-phone">Phone</label>
          <input id="address-phone" name="phone" type="tel" defaultValue={address?.phone ?? ''} className="account-input" autoComplete="tel" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address-type">Type</label>
          <select id="address-type" name="address_type" defaultValue={address?.address_type ?? 'Shipping'} className="account-input">
            <option value="Shipping">Shipping</option>
            <option value="Billing">Billing</option>
          </select>
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="is_shipping_address" defaultChecked={address ? Boolean(address.is_shipping_address) : true} />
        Use as my default delivery address
      </label>
      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={isSaving} className="rounded-lg bg-[#D9B27C] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#c9a068] disabled:cursor-wait disabled:opacity-70">{isSaving ? 'Saving…' : 'Save address'}</button>
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100">Cancel</button>
      </div>
    </form>
  )
}
