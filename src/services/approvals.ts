import { createBaasClient } from '@/services/baas/client'
import type { ApprovalItem } from '@/lib/data'

/**
 * Fetch the pending approvals queue from the BaaS API.
 * Mapped to: GET /api/v1/routeops/queue/approvals
 */
export function getApprovals(): Promise<ApprovalItem[]> {
  const client = createBaasClient()
  return client
    .get<ApprovalItem[]>('/api/v1/routeops/queue/approvals')
    .then((r) => r.data)
}

/**
 * Approve or reject a transfer via the BaaS API.
 * Mapped to:
 *   approve -> POST /api/v1/routeops/transfers/{id}/approve
 *   reject  -> POST /api/v1/routeops/transfers/{id}/reject
 */
export function resolveApproval(
  id: string,
  decision: 'approve' | 'reject',
  _otpId?: string,
  _otpCode?: string,
  reason?: string,
): Promise<unknown> {
  const client = createBaasClient()
  if (decision === 'approve') {
    return client
      .post(`/api/v1/routeops/transfers/${id}/approve`, { checkerEmail: '' })
      .then((r) => r.data)
  }
  return client
    .post(`/api/v1/routeops/transfers/${id}/reject`, { reason: reason ?? '' })
    .then((r) => r.data)
}

export { approveTransfer, rejectTransfer, verifyApprovalOtp } from '@/services/baas/transfers'
