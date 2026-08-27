import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  notificationOpen: boolean
}

const initialState: UIState = {
  sidebarOpen: false,
  notificationOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setNotificationOpen: (state, action: PayloadAction<boolean>) => {
      state.notificationOpen = action.payload
    },
  },
})

export const { setSidebarOpen, toggleSidebar, setNotificationOpen } =
  uiSlice.actions
export default uiSlice.reducer