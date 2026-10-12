import { createSlice } from '@reduxjs/toolkit'

export type Theme = 'light' | 'dark'

const themeSlice = createSlice({
  name: 'theme',
  initialState: { value: 'light' as Theme },
  reducers: {
    toggleTheme: (state) => {
      state.value = state.value === 'light' ? 'dark' : 'light'
    },
  },
})

export const { toggleTheme } = themeSlice.actions
export default themeSlice.reducer
