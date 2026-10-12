import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PlacedOrder, ShippingMethod } from '../../types/catalog'

export type CartLine = { productId: string; quantity: number; weight: string }

export type LastOrder = { id: string; total: number; date: string; paymentMethod: string; paid: boolean; lines: CartLine[] }

export type CommerceState = {
  cart: CartLine[]
  wishlist: string[]
  shippingMethod: ShippingMethod
  lastOrder: LastOrder | null
}

export const initialCommerceState: CommerceState = { cart: [], wishlist: [], shippingMethod: 'free', lastOrder: null }

const commerceSlice = createSlice({
  name: 'commerce',
  initialState: initialCommerceState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartLine>) => {
      const line = state.cart.find((item) => item.productId === action.payload.productId && item.weight === action.payload.weight)
      if (line) line.quantity += action.payload.quantity
      else state.cart.push(action.payload)
    },
    setCartQuantity: (state, action: PayloadAction<{ productId: string; weight: string; quantity: number }>) => {
      const line = state.cart.find((item) => item.productId === action.payload.productId && item.weight === action.payload.weight)
      if (line) line.quantity = Math.max(1, action.payload.quantity)
    },
    removeFromCart: (state, action: PayloadAction<{ productId: string; weight: string }>) => {
      state.cart = state.cart.filter((item) => item.productId !== action.payload.productId || item.weight !== action.payload.weight)
    },
    toggleWishlist: (state, action: PayloadAction<string>) => {
      state.wishlist = state.wishlist.includes(action.payload) ? state.wishlist.filter((id) => id !== action.payload) : [...state.wishlist, action.payload]
    },
    // server copy of a logged-in shopper's wishlist (see app/listeners.ts)
    setWishlist: (state, action: PayloadAction<string[]>) => {
      state.wishlist = action.payload
    },
    // on logout: the wishlist and last order belong to the account, the cart stays
    accountCleared: (state) => {
      state.wishlist = []
      state.lastOrder = null
    },
    setShippingMethod: (state, action: PayloadAction<ShippingMethod>) => {
      state.shippingMethod = action.payload
    },
    orderPlaced: (state, action: PayloadAction<PlacedOrder>) => {
      state.lastOrder = {
        id: action.payload.name,
        total: action.payload.grand_total,
        date: action.payload.transaction_date,
        paymentMethod: action.payload.payment_method,
        paid: action.payload.paid,
        lines: [...state.cart],
      }
      state.cart = []
    },
  },
})

export const {
  addToCart, setCartQuantity, removeFromCart, toggleWishlist, setWishlist, accountCleared, setShippingMethod, orderPlaced,
} = commerceSlice.actions
export default commerceSlice.reducer
