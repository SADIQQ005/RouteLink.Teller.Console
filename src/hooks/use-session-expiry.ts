import { useEffect } from 'react'

import { getToken } from '@/services/http'
import { isTokenExpired } from '@/services/jwt'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/slices/auth-slice'

const CHECK_INTERVAL_MS = 30_000
const EXPIRY_SKEW_MS = 5_000

/**
 * Periodically inspects the stored auth token and signs the user out as soon
 * as it is missing or expired. Also re-checks on window focus so a long-lived,
 * idle tab is logged out promptly rather than waiting for the next tick.
 */
export function useSessionExpiryWatcher(): void {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isAuthenticated) return

    function check() {
      // A missing token should log the user out too — an authenticated state
      // with no stored token is invalid.
      if (isTokenExpired(getToken(), EXPIRY_SKEW_MS, true)) {
        dispatch(logout())
      }
    }

    check()

    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS)
    const handleFocus = () => check()
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isAuthenticated, dispatch])
}