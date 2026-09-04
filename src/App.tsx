import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { RequireAccess } from '@/components/auth/require-access'
import { Loader } from '@/components/ui/loader'
import { useAppSelector } from '@/store'
import { canTransfer, type User } from '@/store/slices/auth-slice'
import { useSessionExpiryWatcher } from '@/hooks/use-session-expiry'

const LoginPage = lazy(() =>
  import('@/pages/login').then((m) => ({ default: m.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })),
)
const NewTransactionPage = lazy(() =>
  import('@/pages/payments/new-transaction').then((m) => ({
    default: m.NewTransactionPage,
  })),
)
const TransactionsPage = lazy(() =>
  import('@/pages/payments/transactions').then((m) => ({
    default: m.TransactionsPage,
  })),
)
const ApprovalQueuePage = lazy(() =>
  import('@/pages/account/approval-queue').then((m) => ({
    default: m.ApprovalQueuePage,
  })),
)
const ReconciliationPage = lazy(() =>
  import('@/pages/account/reconciliation').then((m) => ({
    default: m.ReconciliationPage,
  })),
)
const AuditTrailPage = lazy(() =>
  import('@/pages/account/audit-trail').then((m) => ({
    default: m.AuditTrailPage,
  })),
)
const UsersPage = lazy(() =>
  import('@/pages/administration/users').then((m) => ({ default: m.UsersPage })),
)
const TransactionLimitsPage = lazy(() =>
  import('@/pages/administration/transaction-limits').then((m) => ({
    default: m.TransactionLimitsPage,
  })),
)
const ApprovalRolesPage = lazy(() =>
  import('@/pages/administration/approval-roles').then((m) => ({
    default: m.ApprovalRolesPage,
  })),
)
const ProfilePage = lazy(() =>
  import('@/pages/profile').then((m) => ({ default: m.ProfilePage })),
)

export default function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useSessionExpiryWatcher()

  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-space-grey">
            <Loader />
          </div>
        }
      >
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={<HomeRedirect />}
        />
        <Route
          path="dashboard"
          element={
            <LazyPage>
              <DashboardPage />
            </LazyPage>
          }
        />
        <Route
          path="payments/new"
          element={
            <RequireAccess roles={['Maker', 'Teller']}>
              <LazyPage>
                <NewTransactionPage />
              </LazyPage>
            </RequireAccess>
          }
        />
        <Route
          path="payments/transactions"
          element={
            <LazyPage>
              <TransactionsPage />
            </LazyPage>
          }
        />
        <Route
          path="account/approval-queue"
          element={
            <RequireAccess roles={['Maker', 'Teller', 'Checker']}>
              <LazyPage>
                <ApprovalQueuePage />
              </LazyPage>
            </RequireAccess>
          }
        />
        <Route
          path="account/reconciliation"
          element={
            <LazyPage>
              <ReconciliationPage />
            </LazyPage>
          }
        />
        <Route
          path="account/audit-trail"
          element={
            <LazyPage>
              <AuditTrailPage />
            </LazyPage>
          }
        />
        <Route
          path="administration/users"
          element={
            <LazyPage>
              <UsersPage />
            </LazyPage>
          }
        />
        <Route
          path="administration/transaction-limits"
          element={
            <LazyPage>
              <TransactionLimitsPage />
            </LazyPage>
          }
        />
        <Route
          path="administration/approval-roles"
          element={
            <LazyPage>
              <ApprovalRolesPage />
            </LazyPage>
          }
        />
        <Route
          path="profile"
          element={
            <LazyPage>
              <ProfilePage />
            </LazyPage>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

function HomeRedirect() {
  const user: User = useAppSelector((state) => state.auth.user)
  if (canTransfer(user)) {
    return <Navigate to="/payments/new" replace />
  }
  return <Navigate to="/account/approval-queue" replace />
}

function PageFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader />
    </div>
  )
}