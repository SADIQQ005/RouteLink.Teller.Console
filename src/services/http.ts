import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  REQUEST_TIMEOUT_MS,
} from '@/services/config'
import { getSecureItem, removeSecureItem, setSecureItem } from '@/services/storage'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken(): string | null {
  return getSecureItem(AUTH_TOKEN_KEY)
}

export function setToken(token: string): void {
  setSecureItem(AUTH_TOKEN_KEY, token)
}

export function clearToken(): void {
  removeSecureItem(AUTH_TOKEN_KEY)
}

/**
 * Central axios instance for all first-party requests.
 * A request interceptor injects the auth token on every call.
 * The token value is currently empty until auth is implemented.
 */
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

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

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await httpClient.request<T>(config)
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export const http = {
  get: <T>(path: string, config?: AxiosRequestConfig): Promise<T> =>
    request<T>({ ...config, method: 'GET', url: path }),
  post: <T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    request<T>({ ...config, method: 'POST', url: path, data }),
  patch: <T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    request<T>({ ...config, method: 'PATCH', url: path, data }),
  delete: <T>(path: string, config?: AxiosRequestConfig): Promise<T> =>
    request<T>({ ...config, method: 'DELETE', url: path }),
}
