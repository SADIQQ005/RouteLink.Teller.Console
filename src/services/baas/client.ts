import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { BAAS_BASE_URL, REQUEST_TIMEOUT_MS } from '@/services/config'
import { ApiError, getToken } from '@/services/http'
import { store } from '@/store'
import { logout } from '@/store/slices/auth-slice'

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>
    if (axiosError.code === 'ECONNABORTED') {
      return new ApiError('The request timed out. Please try again.', 0)
    }
    if (!axiosError.response) {
      return new ApiError(
        'Could not reach the server. Check your connection.',
        0,
      )
    }
    const status = axiosError.response.status
    const message =
      axiosError.response.data?.message ??
      axiosError.response.statusText ??
      'Request failed.'
    return new ApiError(message, status)
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 0)
  }
  return new ApiError('Request failed.', 0)
}

/**
 * Creates a configured axios instance for the BaaS (RouteOps) API.
 * A request interceptor injects the auth token on every call; the token
 * value is currently empty until authentication is implemented.
 * All network errors are normalized to `ApiError` so the existing offline
 * / demo fallback in the app can catch them (status === 0).
 */
export function createBaasClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: BAAS_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // A 401 while a token is present means the token is expired/invalid.
      // Sign the user out so they are returned to the login screen.
      if (axios.isAxiosError(error) && error.response?.status === 401 && getToken()) {
        store.dispatch(logout())
      }
      return Promise.reject(toApiError(error))
    },
  )

  return instance
}
