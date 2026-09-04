import { setToken } from '@/services/http'
import { entraIdLogin } from '@/services/baas/auth'
import {
  claimString,
  decodeJwtPayload,
  ENTRA_CLAIMS,
  roleClaimValues,
  type EntraIdClaims,
} from '@/services/jwt'
import type { AccessRole, User } from '@/store/slices/auth-slice'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthSession {
  token: string
  user: User
}

const ROLE_CLAIMS = {
  TELLER: 'MFB_TELLER',
  MAKER: 'MFB_MAKER',
  CHECKER: 'MFB_CHECKER',
} as const

function rolesFromClaims(claims: EntraIdClaims): AccessRole[] {
  const values = roleClaimValues(claims)
  const roles: AccessRole[] = []
  if (values.includes(ROLE_CLAIMS.TELLER)) roles.push('Teller')
  if (values.includes(ROLE_CLAIMS.MAKER)) roles.push('Maker')
  if (values.includes(ROLE_CLAIMS.CHECKER)) roles.push('Checker')
  return roles
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName = parts.slice(1).join(' ') || firstName
  return { firstName, lastName }
}

function claimsToUser(claims: EntraIdClaims): User {
  const name = claimString(claims, ENTRA_CLAIMS.name) ||
    claimString(claims, ENTRA_CLAIMS.preferredUsername)
  const { firstName, lastName } = splitName(name)
  const roles = rolesFromClaims(claims)
  const tier: User['tier'] = roles.includes('Checker')
    ? 'Checker'
    : roles.includes('Maker')
      ? 'Maker'
      : 'Teller'
  return {
    id:
      claimString(claims, ENTRA_CLAIMS.nameIdentifier) ||
      claimString(claims, ENTRA_CLAIMS.preferredUsername) ||
      name,
    firstName,
    lastName,
    email: claimString(claims, ENTRA_CLAIMS.preferredUsername),
    role: roles.join(' / ') || 'Teller',
    branch: '',
    tier,
    roles,
    lastLogin: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    twoFactorEnabled: false,
  }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const response = await entraIdLogin({
    usernameOrEmail: input.email,
    password: input.password,
  })
  setToken(response.accessToken)
  const claims = decodeJwtPayload(response.accessToken)
  const user = claimsToUser(claims)
  return { token: response.accessToken, user }
}
