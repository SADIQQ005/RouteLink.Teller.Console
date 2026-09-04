/**
 * Session-scoped storage (sessionStorage) for sensitive values such as the
 * auth token and the current user session.
 *
 * Unlike localStorage, sessionStorage is cleared when the tab or browser
 * closes and offers a smaller attack surface, making it the appropriate
 * browser-level storage for a teller console. Access is guarded so a
 * storage-unavailable environment degrades to no-ops rather than throwing.
 */

const isBrowser = typeof window !== 'undefined'

function getStore(): Storage | null {
  if (!isBrowser) return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function getSecureItem(key: string): string | null {
  const store = getStore()
  if (!store) return null
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

export function setSecureItem(key: string, value: string): void {
  const store = getStore()
  if (!store) return
  try {
    store.setItem(key, value)
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function removeSecureItem(key: string): void {
  const store = getStore()
  if (!store) return
  try {
    store.removeItem(key)
  } catch {
    /* ignore */
  }
}
