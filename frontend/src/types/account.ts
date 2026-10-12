// Shapes returned by bossco/account.py

export type SessionUser = {
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone: string
  isSystemUser: boolean
}

export type Session = { user: SessionUser | null; csrf_token: string | null }

export type Address = {
  name: string
  address_type: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  country: string
  phone: string | null
  is_shipping_address: 0 | 1
}

export type AddressInput = Omit<Address, 'name' | 'is_shipping_address' | 'address_line2' | 'phone'> & {
  name?: string
  address_line2?: string
  phone?: string
  is_shipping_address?: 0 | 1
}

export type OrderItem = { itemCode: string; itemName: string; qty: number; rate: number; amount: number; image: string }

export type OrderStatus = 'Awaiting confirmation' | 'Processing' | 'Partly shipped' | 'Delivered' | 'On hold' | 'Cancelled'

export type Order = {
  name: string
  date: string
  status: OrderStatus
  total: number
  currency: string
  paymentMethod: string
  paymentReference: string
  paid: boolean
  shippingAddress: string
  items: OrderItem[]
}
