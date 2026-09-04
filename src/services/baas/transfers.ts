import { createBaasClient } from '@/services/baas/client'
import type {
  ApprovalQueueParams,
  ApprovalQueueResponse,
  ApproveTransferInput,
  CreateTransferInput,
  CreateTransferResponse,
  RejectTransferInput,
  Transfer,
  VerifyApprovalOtpInput,
  VerifyCustomerOtpInput,
} from '@/services/baas/types'

/**
 * Initiate a transfer. Returns the unwrapped transfer so callers can use
 * `transferRequestId` as the id for the subsequent OTP / approval flow.
 */
export async function createTransfer(
  payload: CreateTransferInput,
): Promise<Transfer> {
  const client = createBaasClient()
  const { data } = await client.post<CreateTransferResponse>(
    '/api/v1/routeops/transfers',
    payload,
  )
  return data.value
}

/** Verify the customer's OTP for a pending transfer (id = transferRequestId). */
export async function verifyCustomerOtp(
  id: string,
  payload: VerifyCustomerOtpInput,
): Promise<unknown> {
  const client = createBaasClient()
  const { data } = await client.post(
    `/api/v1/routeops/transfers/${id}/verify-customer-otp`,
    payload,
  )
  return data
}

/** Approve a transfer as a checker (id = transferRequestId). */
export async function approveTransfer(
  id: string,
  payload: ApproveTransferInput,
): Promise<unknown> {
  const client = createBaasClient()
  const { data } = await client.post(
    `/api/v1/routeops/transfers/${id}/approve`,
    payload,
  )
  return data
}

/** Verify the checker's (approval) OTP for an approved transfer (id = transferRequestId). */
export async function verifyApprovalOtp(
  id: string,
  payload: VerifyApprovalOtpInput,
): Promise<unknown> {
  const client = createBaasClient()
  const { data } = await client.post(
    `/api/v1/routeops/transfers/${id}/verify-approval-otp`,
    payload,
  )
  return data
}

/** Reject a transfer with a reason (id = transferRequestId). */
export async function rejectTransfer(
  id: string,
  payload: RejectTransferInput,
): Promise<unknown> {
  const client = createBaasClient()
  const { data } = await client.post(
    `/api/v1/routeops/transfers/${id}/reject`,
    payload,
  )
  return data
}

/** Fetch the pending approvals queue. Returns the full paginated response. */
export async function getApprovalQueue(
  params: ApprovalQueueParams = {},
): Promise<ApprovalQueueResponse> {
  const client = createBaasClient()
  const { data } = await client.get<ApprovalQueueResponse>(
    '/api/v1/routeops/queue/approvals',
    { params },
  )
  return data
}
