import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  api,
  type AuditEntry,
  type DashboardStats,
  type ReconciliationItem,
  type Transaction,
  type TransactionLimit,
  type ApprovalRole,
  type UserRecord,
} from '@/lib/data'
import type { ApprovalsResult } from '@/services/approvals'
import type { ApprovalQueueParams } from '@/services/baas/types'

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

export function useApprovals(
  params: ApprovalQueueParams = {},
  enabled = true,
) {
  return useQuery<ApprovalsResult>({
    queryKey: [...queryKeys.approvals, params],
    queryFn: () => api.getApprovals(params),
    enabled,
  })
}

export function useRejectApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; reason: string }) =>
      api.rejectApproval(args.id, args.reason),
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