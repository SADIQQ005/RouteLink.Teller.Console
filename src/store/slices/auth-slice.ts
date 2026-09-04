import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { clearToken } from '@/services/http'
import { getSecureItem, removeSecureItem, setSecureItem } from '@/services/storage'

export type Tier = 'Teller' | 'Maker' | 'Checker' | 'Administrator'
export type AccessRole = 'Teller' | 'Maker' | 'Checker'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  branch: string
  tier: Tier
  /** Capability roles. A user may hold Maker (can transfer), Checker (can approve), or both. */
  roles: AccessRole[]
  lastLogin: string
  twoFactorEnabled: boolean
}

export function hasRole(user: User, role: AccessRole): boolean {
  return user.roles.includes(role)
}

export function canTransfer(user: User): boolean {
  return hasRole(user, 'Maker') || hasRole(user, 'Teller')
}

export function canApprove(user: User): boolean {
  return hasRole(user, 'Checker')
}

export function canAdminister(user: User): boolean {
  return hasRole(user, 'Maker') && hasRole(user, 'Checker')
}

// Any DPR role (Maker, Teller, Checker) may view the approval queue,
// though only Checkers can sign off on items.
export function canViewApprovals(user: User): boolean {
  return canTransfer(user) || canApprove(user)
}

const STORAGE_KEY = 'routelink.teller.auth'

interface StoredSession {
  user: Partial<User> & { access?: AccessRole }
}

const EMPTY_USER: User = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  branch: '',
  tier: 'Maker',
  roles: [],
  lastLogin: '',
  twoFactorEnabled: false,
}

function normalizeUser(raw: StoredSession['user']): User {
  // Migrate legacy sessions that only stored a single `access` role.
  const legacyRoles: AccessRole[] = raw.access
    ? raw.access === 'Maker'
      ? ['Maker']
      : ['Checker']
    : []
  const roles = Array.isArray(raw.roles) && raw.roles.length > 0
    ? raw.roles
    : legacyRoles
  return {
    ...EMPTY_USER,
    ...raw,
    roles,
    tier:
      raw.tier ??
      (roles.includes('Checker')
        ? 'Checker'
        : roles.includes('Maker')
          ? 'Maker'
          : roles.includes('Teller')
            ? 'Teller'
            : 'Maker'),
  }
}

function loadSession(): User | null {
  try {
    const raw = getSecureItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed?.user) return normalizeUser(parsed.user)
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
  user: startUser ?? EMPTY_USER,
  isAuthenticated: !!startUser,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      setSecureItem(STORAGE_KEY, JSON.stringify({ user: state.user }))
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      state.user = { ...state.user, ...action.payload }
      setSecureItem(STORAGE_KEY, JSON.stringify({ user: state.user }))
    },
    setTwoFactor: (state, action: PayloadAction<boolean>) => {
      state.user.twoFactorEnabled = action.payload
      setSecureItem(STORAGE_KEY, JSON.stringify({ user: state.user }))
    },
    logout: (state) => {
      removeSecureItem(STORAGE_KEY)
      clearToken()
      state.user = EMPTY_USER
      state.isAuthenticated = false
    },
  },
})

export const { loginSuccess, updateUser, setTwoFactor, logout } = authSlice.actions
export default authSlice.reducer
