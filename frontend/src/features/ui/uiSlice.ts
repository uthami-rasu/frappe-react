import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Transient UI state shared across components; never persisted.
export type UiState = { cartDrawerOpen: boolean; lastAddedId: string | null; cartPulse: number }

const initialState: UiState = { cartDrawerOpen: false, lastAddedId: null, cartPulse: 0 }

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCartDrawer: (state, action: PayloadAction<string | undefined>) => {
      state.cartDrawerOpen = true
      state.lastAddedId = action.payload ?? null
    },
    closeCartDrawer: (state) => {
      state.cartDrawerOpen = false
    },
    // bumps the header cart badge animation
    pulseCart: (state) => {
      state.cartPulse += 1
    },
  },
})

export const { openCartDrawer, closeCartDrawer, pulseCart } = uiSlice.actions
export default uiSlice.reducer
