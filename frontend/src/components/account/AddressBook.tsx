import { toast } from 'sonner'
import { Edit3, MapPin, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteAddressMutation, useGetAddressesQuery, useSaveAddressMutation } from '../../features/api/storeApi'
import type { Address, AddressInput } from '../../types/account'
import { formatAddress } from '../../utils/address'
import { AddressForm } from './AddressForm'

export function AddressBook({ fullName }: { fullName: string }) {
  const { data: addresses = [], isLoading } = useGetAddressesQuery()
  const [saveAddress, { isLoading: isSaving }] = useSaveAddressMutation()
  const [deleteAddress] = useDeleteAddressMutation()
  // null: no form, 'new': adding, otherwise the address being edited
  const [editing, setEditing] = useState<Address | 'new' | null>(null)

  const handleSave = async (address: AddressInput) => {
    try {
      await saveAddress(address).unwrap()
      setEditing(null)
      toast.success('Address saved')
    } catch (error) {
      toast.error('Could not save the address', { description: typeof error === 'string' ? error : undefined })
    }
  }

  const handleDelete = async (address: Address) => {
    try {
      await deleteAddress(address.name).unwrap()
      toast.info('Address removed')
    } catch (error) {
      toast.error('Could not remove the address', { description: typeof error === 'string' ? error : undefined })
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-[#e2ded5] rounded-xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[#173f32]">Addresses</h2>
        {editing === null && (
          <button type="button" onClick={() => setEditing('new')} className="text-[#D9B27C] hover:underline font-bold text-sm flex items-center gap-1">
            Add address +
          </button>
        )}
      </div>

      {editing !== null && (
        <div className="mb-6">
          <AddressForm address={editing === 'new' ? undefined : editing} isSaving={isSaving} onSave={handleSave} onCancel={() => setEditing(null)} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-stone-500">Loading addresses…</p>
      ) : addresses.length === 0 && editing === null ? (
        <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-stone-300 py-12 text-center text-sm text-stone-500">
          <MapPin className="text-[#D9B27C]" size={26} />
          No saved addresses yet. Add one now, or it will be saved when you check out.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address.name} className="border-2 border-[#E6C594] rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between text-[#D9B27C] font-bold mb-3">
                <span>{address.address_type} address{address.is_shipping_address ? <span className="ml-2 rounded-full bg-[#eef3ea] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#527d49]">Default</span> : null}</span>
                <span className="flex gap-3">
                  <button type="button" onClick={() => setEditing(address)} className="flex items-center gap-1 text-xs hover:underline"><Edit3 size={14} /> Edit</button>
                  <button type="button" onClick={() => handleDelete(address)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-600" aria-label="Remove address"><Trash2 size={14} /></button>
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-stone-900">{fullName}</p>
                {address.phone && <p className="text-stone-600">{address.phone}</p>}
                <p className="text-stone-600">{formatAddress(address)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
