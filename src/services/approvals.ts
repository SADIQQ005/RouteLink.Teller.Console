import { http } from '@/services/http'
import type { ApprovalItem } from '@/lib/data'

export function getApprovals(): Promise<ApprovalItem[]> {
  return http.get<ApprovalItem[]>('/approvals')
}

export function resolveApproval(
  id: string,
  decision: 'approve' | 'reject',
  reason?: string,
): Promise<unknown> {
  return http.post<unknown>(`/approvals/${id}/resolve`, { decision, reason })
}