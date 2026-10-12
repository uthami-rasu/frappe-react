import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PlacedOrder, ShippingMethod } from '../../types/catalog'

export type CartLine = { productId: string; quantity: number; weight: string }

export type LastOrder = { id: string; total: number; date: string; paymentMethod: string; paid: boolean; lines: CartLine[]; email?: string | null }

export type CommerceState = {
  cart: CartLine[]
  wishlist: string[]
  shippingMethod: ShippingMethod
  lastOrder: LastOrder | null
  // what the shopper typed; ERPNext decides whether and how much it discounts (see getCartQuote)
  couponCode: string
  // product ids, most recent first; a per-browser convenience, not account data
  recentlyViewed: string[]
}

export const RECENTLY_VIEWED_LIMIT = 12
// bossco/api.py MAX_QTY_PER_LINE; the server enforces it, this keeps the stepper honest
export const MAX_QTY_PER_LINE = 100

export const initialCommerceState: CommerceState = {
  cart: [], wishlist: [], shippingMethod: 'free', lastOrder: null, couponCode: '', recentlyViewed: [],
}

const commerceSlice = createSlice({
  name: 'commerce',
  initialState: initialCommerceState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartLine>) => {
      const line = state.cart.find((item) => item.productId === action.payload.productId && item.weight === action.payload.weight)
      if (line) line.quantity = Math.min(MAX_QTY_PER_LINE, line.quantity + action.payload.quantity)
      else state.cart.push({ ...action.payload, quantity: Math.min(MAX_QTY_PER_LINE, action.payload.quantity) })
    },
    // server copy of a logged-in shopper's cart (see app/listeners.ts)
    setCart: (state, action: PayloadAction<CartLine[]>) => {
      state.cart = action.payload
    },
    setCartQuantity: (state, action: PayloadAction<{ productId: string; weight: string; quantity: number }>) => {
      const line = state.cart.find((item) => item.productId === action.payload.productId && item.weight === action.payload.weight)
      if (line) line.quantity = Math.min(MAX_QTY_PER_LINE, Math.max(1, action.payload.quantity))
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
      state.couponCode = ''
    },
    setCouponCode: (state, action: PayloadAction<string>) => {
      state.couponCode = action.payload.trim().toUpperCase()
    },
    productViewed: (state, action: PayloadAction<string>) => {
      state.recentlyViewed = [action.payload, ...state.recentlyViewed.filter((id) => id !== action.payload)].slice(0, RECENTLY_VIEWED_LIMIT)
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
        email: action.payload.email ?? null,
        lines: [...state.cart],
      }
      state.cart = []
      state.couponCode = ''
    },
  },
})

export const {
  addToCart, setCart, setCartQuantity, removeFromCart, toggleWishlist, setWishlist, accountCleared, setShippingMethod, orderPlaced,
  setCouponCode, productViewed,
} = commerceSlice.actions
export default commerceSlice.reducer
