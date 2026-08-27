import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { clearToken } from '@/services/http'
import { makerUser } from '@/lib/demo-users'

export type Tier = 'Teller' | 'Maker' | 'Checker' | 'Administrator'
export type AccessRole = 'Maker' | 'Checker'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  branch: string
  tier: Tier
  access: AccessRole
  lastLogin: string
  twoFactorEnabled: boolean
}

const STORAGE_KEY = 'routelink.teller.auth'

interface StoredSession {
  user: User
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed?.user) return parsed.user
    }
  } catch {
    /* ignore */
  }
  return null
}

interface AuthState {
  user: User
  isAuthenticated: boolean
}

const startUser = loadSession()

const initialState: AuthState = {
  user: startUser ?? makerUser,
  isAuthenticated: !!startUser,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: state.user }))
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: state.user }))
    },
    setTwoFactor: (state, action: PayloadAction<boolean>) => {
      state.user.twoFactorEnabled = action.payload
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: state.user }))
    },
    logout: (state) => {
      localStorage.removeItem(STORAGE_KEY)
      clearToken()
      state.user = makerUser
      state.isAuthenticated = false
    },
  },
})

export const {
  loginSuccess,
  updateUser,
  setTwoFactor,
  logout,
} = authSlice.actions
export default authSlice.reducer