import { configureStore } from '@reduxjs/toolkit'
import themeReducer from '../features/theme/themeSlice'
import commerceReducer, { initialCommerceState, type CommerceState } from '../features/commerce/commerceSlice'
import uiReducer from '../features/ui/uiSlice'
import { storeApi } from '../features/api/storeApi'
import { listenerMiddleware } from './listeners'

const COMMERCE_STORAGE_KEY = 'bossco:commerce'

// Cart, wishlist and last order survive reloads; storage can be unavailable (private mode).
function loadCommerce(): CommerceState {
  try {
    const saved = localStorage.getItem(COMMERCE_STORAGE_KEY)
    return saved ? { ...initialCommerceState, ...JSON.parse(saved) } : initialCommerceState
  } catch {
    return initialCommerceState
  }
}

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    commerce: commerceReducer,
    ui: uiReducer,
    [storeApi.reducerPath]: storeApi.reducer,
  },
  preloadedState: { commerce: loadCommerce() },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(storeApi.middleware),
})

let savedCommerce = store.getState().commerce
store.subscribe(() => {
  const { commerce } = store.getState()
  if (commerce === savedCommerce) return
  savedCommerce = commerce
  try {
    localStorage.setItem(COMMERCE_STORAGE_KEY, JSON.stringify(commerce))
  } catch {
    // ignore: persistence is a convenience
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
