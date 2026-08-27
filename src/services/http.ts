import {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  REQUEST_TIMEOUT_MS,
} from '@/services/config'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

interface RequestOptions extends RequestInit {
  data?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const token = getToken()

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
      body:
        options.data !== undefined ? JSON.stringify(options.data) : options.body,
    })
  } catch (error) {
    clearTimeout(timer)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 0)
    }
    throw new ApiError('Could not reach the server. Check your connection.', 0)
  }
  clearTimeout(timer)

  if (!response.ok) {
    let message = response.statusText || 'Request failed.'
    try {
      const body = (await response.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      /* keep statusText */
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const http = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', data }),
  patch: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', data }),
  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: 'DELETE' }),
}