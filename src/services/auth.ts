import { ApiError, http, setToken } from '@/services/http'
import { makerUser, checkerUser, pickDemoUser } from '@/lib/demo-users'
import type { User } from '@/store/slices/auth-slice'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthSession {
  token: string
  user: User
}

interface AuthResponse {
  token: string
  user: Partial<User>
}

function normalizeUser(raw: Partial<User>, fallback: User): User {
  return {
    id: raw.id ?? fallback.id,
    firstName: raw.firstName ?? fallback.firstName,
    lastName: raw.lastName ?? fallback.lastName,
    email: raw.email ?? fallback.email,
    role: raw.role ?? fallback.role,
    branch: raw.branch ?? fallback.branch,
    tier: raw.tier === undefined ? fallback.tier : mapTier(raw.tier),
    access: raw.access ?? fallback.access,
    lastLogin:
      raw.lastLogin ??
      new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    twoFactorEnabled: raw.twoFactorEnabled ?? fallback.twoFactorEnabled,
  }
}

function mapTier(tier: User['tier']): User['tier'] {
  if (tier === 'Maker' || tier === 'Checker') return tier
  return 'Maker'
}

async function demoLogin(email: string): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 550))
  const user = pickDemoUser(email)
  const token = `demo-${user.access.toLowerCase()}-${Date.now()}`
  setToken(token)
  return { token, user }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  try {
    const response = await http.post<AuthResponse>('/auth/login', input)
    const fallback = pickDemoUser(input.email)
    const user = normalizeUser(response.user, fallback)
    setToken(response.token)
    return { token: response.token, user }
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      return demoLogin(input.email)
    }
    throw error
  }
}

export function getDemoUsers(): { maker: User; checker: User } {
  return { maker: makerUser, checker: checkerUser }
}