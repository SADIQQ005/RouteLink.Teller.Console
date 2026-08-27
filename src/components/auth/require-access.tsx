import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAppSelector } from '@/store'
import type { AccessRole } from '@/store/slices/auth-slice'

export function RequireAccess({
  access,
  children,
}: {
  access: AccessRole
  children: ReactNode
}) {
  const user = useAppSelector((state) => state.auth.user)

  if (user.access !== access) {
    return <Navigate to="/" replace />
  }

  return children
}