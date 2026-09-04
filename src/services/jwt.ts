export const ENTRA_CLAIMS = {
  nameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  preferredUsername: 'preferred_username',
  role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  mfbRolesResolved: 'mfb_roles_resolved',
} as const

export interface EntraIdClaims {
  [key: string]: unknown
  exp?: number
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/** Decode a JWT payload (claims object) without validating the signature. */
export function decodeJwtPayload(token: string): EntraIdClaims {
  const parts = token.split('.')
  if (parts.length < 2) {
    throw new Error('Invalid token format')
  }
  const raw = base64UrlDecode(parts[1])
  return JSON.parse(raw) as EntraIdClaims
}

function claimValue(claims: EntraIdClaims, key: string): unknown {
  return claims[key]
}

export function claimString(claims: EntraIdClaims, key: string): string {
  const value = claimValue(claims, key)
  return typeof value === 'string' ? value : ''
}

/** Resolve a role claim value, normalizing a single/array claim to a list. */
export function roleClaimValues(claims: EntraIdClaims): string[] {
  const role = claimValue(claims, ENTRA_CLAIMS.role)
  if (Array.isArray(role)) return role.filter((r): r is string => typeof r === 'string')
  if (typeof role === 'string') return [role]
  return []
}

/** Returns the token's `exp` claim as an epoch-ms timestamp, or null if absent/unreadable. */
export function getJwtExpiry(token?: string | null): number | null {
  if (!token) return null
  try {
    const claims = decodeJwtPayload(token)
    if (typeof claims.exp !== 'number') return null
    return claims.exp * 1000
  } catch {
    return null
  }
}

/**
 * Whether the token has expired (or carries no usable expiry and the caller
 * treats a missing token as expired via `missingMeansExpired`).
 */
export function isTokenExpired(
  token?: string | null,
  skewMs = 0,
  missingMeansExpired = false,
): boolean {
  if (!token) return missingMeansExpired
  const expiry = getJwtExpiry(token)
  if (expiry === null) return missingMeansExpired
  return Date.now() >= expiry - skewMs
}
