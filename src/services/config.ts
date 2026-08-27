export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000/api'

export const AUTH_TOKEN_KEY = 'routelink.teller.token'
export const REQUEST_TIMEOUT_MS = 10_000