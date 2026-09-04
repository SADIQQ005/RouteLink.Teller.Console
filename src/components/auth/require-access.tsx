import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAppSelector } from '@/store'
import { hasRole, type AccessRole } from '@/store/slices/auth-slice'

export function RequireAccess({
  roles,
  children,
}: {
  roles: AccessRole[]
  children: ReactNode
}) {
  const user = useAppSelector((state) => state.auth.user)

  if (!roles.some((role) => hasRole(user, role))) {
    return <Navigate to="/" replace />
  }

  return children
}