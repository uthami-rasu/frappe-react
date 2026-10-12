import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import { storeApi, type CartItemRow } from '../features/api/storeApi'
import {
  accountCleared, addToCart, removeFromCart, setCart, setCartQuantity, setWishlist, toggleWishlist,
} from '../features/commerce/commerceSlice'
import type { CartLine, CommerceState } from '../features/commerce/commerceSlice'
import type { Session } from '../types/account'

// Typed loosely to avoid a circular import with store.ts
type ListenerState = { commerce: CommerceState }

export const listenerMiddleware = createListenerMiddleware()

const CART_SYNC_DELAY = 800

const isLoggedIn = (state: unknown) => Boolean(storeApi.endpoints.getSession.select()(state as never).data?.user)
const toRows = (cart: CartLine[]): CartItemRow[] => cart.map((line) => ({ item_code: line.productId, qty: line.quantity }))

// Server rows carry no pack size; take it from the local line or the catalog
async function toLines(rows: CartItemRow[], local: CartLine[], api: { dispatch: (action: never) => unknown; getState: () => unknown }) {
  let catalog = storeApi.endpoints.getCatalog.select()(api.getState() as never).data
  if (!catalog) {
    const request = api.dispatch(storeApi.endpoints.getCatalog.initiate() as never) as unknown as { unwrap: () => Promise<typeof catalog>; unsubscribe: () => void }
    catalog = await request.unwrap().catch(() => undefined)
    request.unsubscribe()
  }
  return rows.map((row) => ({
    productId: row.item_code,
    quantity: row.qty,
    weight: local.find((line) => line.productId === row.item_code)?.weight ?? catalog?.products.find((product) => product.id === row.item_code)?.size ?? '',
  }))
}

// A session with a user appears (page load, login, sign up): merge what was saved while logged
// out into the account's wishlist and cart, and use the server copies from then on.
listenerMiddleware.startListening({
  matcher: isAnyOf(
    storeApi.endpoints.getSession.matchFulfilled,
    storeApi.endpoints.login.matchFulfilled,
    storeApi.endpoints.signUp.matchFulfilled,
  ),
  effect: async (action, api) => {
    const session = (action as unknown as { payload: Session }).payload
    if (!session.user) return
    api.cancelActiveListeners()
    const { wishlist, cart } = (api.getState() as ListenerState).commerce
    const [savedWishlist, savedCart] = await Promise.all([
      api.dispatch(storeApi.endpoints.mergeWishlist.initiate(wishlist)),
      api.dispatch(storeApi.endpoints.mergeCart.initiate(toRows(cart))),
    ])
    if ('data' in savedWishlist && savedWishlist.data) api.dispatch(setWishlist(savedWishlist.data))
    if ('data' in savedCart && savedCart.data) api.dispatch(setCart(await toLines(savedCart.data, cart, api as never)))
  },
})

// Heart buttons toggle locally right away; mirror the change to ERPNext when logged in and
// undo it if the server refuses, so the heart never shows a state that wasn't saved.
listenerMiddleware.startListening({
  actionCreator: toggleWishlist,
  effect: async (action, api) => {
    if (!isLoggedIn(api.getState())) return
    const itemCode = action.payload
    const previous = (api.getOriginalState() as ListenerState).commerce.wishlist
    const isSaved = (api.getState() as ListenerState).commerce.wishlist.includes(itemCode)
    const endpoint = isSaved ? storeApi.endpoints.addToWishlist : storeApi.endpoints.removeFromWishlist
    const result = await api.dispatch(endpoint.initiate(itemCode))
    if ('data' in result && result.data) {
      api.dispatch(setWishlist(result.data))
    } else {
      api.dispatch(setWishlist(previous))
      toast.error('Could not update your wishlist', { description: 'Please check your connection and try again.' })
    }
  },
})

// Save the cart to the account a moment after the last change (quantity steppers fire quickly)
listenerMiddleware.startListening({
  matcher: isAnyOf(addToCart, setCartQuantity, removeFromCart),
  effect: async (_action, api) => {
    if (!isLoggedIn(api.getState())) return
    api.cancelActiveListeners()
    await api.delay(CART_SYNC_DELAY)
    // a failed save is retried with the next change; the browser copy stays the working cart
    await api.dispatch(storeApi.endpoints.setCart.initiate(toRows((api.getState() as ListenerState).commerce.cart)))
  },
})

listenerMiddleware.startListening({
  matcher: storeApi.endpoints.logout.matchFulfilled,
  effect: (_, api) => {
    api.dispatch(accountCleared())
  },
})
