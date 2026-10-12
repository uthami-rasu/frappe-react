import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { storeApi } from '../features/api/storeApi'
import { accountCleared, setWishlist, toggleWishlist } from '../features/commerce/commerceSlice'
import type { CommerceState } from '../features/commerce/commerceSlice'
import type { Session } from '../types/account'

// Typed loosely to avoid a circular import with store.ts
type ListenerState = { commerce: CommerceState }

export const listenerMiddleware = createListenerMiddleware()

const isLoggedIn = (state: unknown) => Boolean(storeApi.endpoints.getSession.select()(state as never).data?.user)

// A session with a user appears (page load, login, sign up): merge what was saved while logged
// out into the account's wishlist and use the server copy from then on.
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
    const local = (api.getState() as ListenerState).commerce.wishlist
    const result = await api.dispatch(storeApi.endpoints.mergeWishlist.initiate(local))
    if ('data' in result && result.data) api.dispatch(setWishlist(result.data))
  },
})

// Heart buttons dispatch toggleWishlist locally; mirror the change to ERPNext when logged in.
listenerMiddleware.startListening({
  actionCreator: toggleWishlist,
  effect: async (action, api) => {
    if (!isLoggedIn(api.getState())) return
    const itemCode = action.payload
    const isSaved = (api.getState() as ListenerState).commerce.wishlist.includes(itemCode)
    const endpoint = isSaved ? storeApi.endpoints.addToWishlist : storeApi.endpoints.removeFromWishlist
    const result = await api.dispatch(endpoint.initiate(itemCode))
    if ('data' in result && result.data) api.dispatch(setWishlist(result.data))
  },
})

listenerMiddleware.startListening({
  matcher: storeApi.endpoints.logout.matchFulfilled,
  effect: (_, api) => {
    api.dispatch(accountCleared())
  },
})
