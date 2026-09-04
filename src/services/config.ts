export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000/api'

export const BAAS_BASE_URL =
  (import.meta.env.VITE_BAAS_API_URL as string | undefined) ??
  'https://apidev.routepay.com/baas/'

// Base path for the RouteOps BaaS API
export const BAAS_API_PREFIX = '/api/v1/routeops'

// Authentication path on the BaaS API (Entra ID login)
export const BAAS_AUTH_LOGIN_PATH = '/api/v1/auth/entra-id/login'

export const AUTH_TOKEN_KEY = 'routelink.teller.token'
export const REQUEST_TIMEOUT_MS = 10_000