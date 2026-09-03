import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  api,
  type ApprovalItem,
  type AuditEntry,
  type DashboardStats,
  type ReconciliationItem,
  type Transaction,
  type TransactionLimit,
  type TransactionStatus,
  type ApprovalRole,
  type UserRecord,
} from '@/lib/data'

export const queryKeys = {
  stats: ['stats'] as const,
  transactions: ['transactions'] as const,
  approvals: ['approvals'] as const,
  users: ['users'] as const,
  limits: ['limits'] as const,
  roles: ['roles'] as const,
  audit: ['audit'] as const,
  reconciliation: ['reconciliation'] as const,
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.stats,
    queryFn: api.getDashboardStats,
  })
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: queryKeys.transactions,
    queryFn: api.getTransactions,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: TransactionStatus
    }) => api.updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    },
  })
}

export function useApprovals() {
  return useQuery<ApprovalItem[]>({
    queryKey: queryKeys.approvals,
    queryFn: api.getApprovals,
  })
}

export function useResolveApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      id: string
      decision: 'approve' | 'reject'
      otpId?: string
      otpCode?: string
      reason?: string
    }) =>
      api.resolveApproval(
        args.id,
        args.decision,
        args.otpId,
        args.otpCode,
        args.reason,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useUsers() {
  return useQuery<UserRecord[]>({
    queryKey: queryKeys.users,
    queryFn: api.getUsers,
  })
}

export function useLimits() {
  return useQuery<TransactionLimit[]>({
    queryKey: queryKeys.limits,
    queryFn: api.getLimits,
  })
}

export function useRoles() {
  return useQuery<ApprovalRole[]>({
    queryKey: queryKeys.roles,
    queryFn: api.getRoles,
  })
}

export function useAuditTrail() {
  return useQuery<AuditEntry[]>({
    queryKey: queryKeys.audit,
    queryFn: api.getAuditTrail,
  })
}

export function useReconciliation() {
  return useQuery<ReconciliationItem[]>({
    queryKey: queryKeys.reconciliation,
    queryFn: api.getReconciliation,
  })
}