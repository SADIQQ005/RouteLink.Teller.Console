import { getApprovalQueue, rejectTransfer } from '@/services/baas/transfers'
import type {
  ApprovalQueueItem,
  ApprovalQueueParams,
  ApprovalQueueResponse,
} from '@/services/baas/types'
import type { ApprovalItem } from '@/lib/data'

/** Mapped approvals queue result: records plus the server-side snapshot & pagination. */
export interface ApprovalsResult {
  items: ApprovalItem[]
  snapshot: ApprovalQueueResponse['snapshot']
  totalMatchingFilter: number
  page: number
  pageSize: number
}

const TIER_2_LIMIT = 5_000_000
const TIER_3_LIMIT = 25_000_000

const PRIORITY_MAP: Record<number, ApprovalItem['priority']> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
}

function mapQueueItem(item: ApprovalQueueItem): ApprovalItem {
  const amount = item.amount ?? 0
  const requiredTier =
    amount >= TIER_3_LIMIT ? 3 : amount >= TIER_2_LIMIT ? 2 : 1
  const priority = PRIORITY_MAP[item.priority ?? 0] ?? 'Low'
  return {
    id: item.id,
    reference: item.transactionReference,
    beneficiary: item.beneficiaryName,
    beneficiaryAccount: item.beneficiaryAccountNumber,
    beneficiaryBank: '',
    sourceAccount: item.debitAccountNumber,
    amount,
    currency: 'NGN',
    type: 'Debit',
    initiatedBy: item.makerUserId,
    tier: 1,
    requiredTier,
    priority,
    submittedAt: item.createdAt,
    method: 'Bank Transfer',
    narration: 'Bank account transfer',
    documents: [],
  }
}

/**
 * Fetch the pending approvals queue from the BaaS API along with its snapshot
 * and pagination metadata.
 * Mapped to: GET /api/v1/routeops/queue/approvals
 */
export async function getApprovals(
  params: ApprovalQueueParams = {},
): Promise<ApprovalsResult> {
  const response = await getApprovalQueue(params)
  return {
    items: (response.items ?? []).map(mapQueueItem),
    snapshot: response.snapshot,
    totalMatchingFilter: response.totalMatchingFilter ?? 0,
    page: response.page ?? 1,
    pageSize: response.pageSize ?? 0,
  }
}

/**
 * Reject a transfer via the BaaS API using the transfer id.
 * Mapped to: POST /api/v1/routeops/transfers/{id}/reject
 * (Approval is handled by approveTransfer + verifyApprovalOtp in transfers.ts.)
 */
export function rejectApproval(id: string, reason: string): Promise<unknown> {
  return rejectTransfer(id, { reason })
}

export { approveTransfer, verifyApprovalOtp } from '@/services/baas/transfers'
