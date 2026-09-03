import { createBaasClient } from '@/services/baas/client'
import type {
  ApprovalQueueParams,
  ApproveTransferInput,
  CreateTransferInput,
  RejectTransferInput,
  Transfer,
  VerifyApprovalOtpInput,
  VerifyCustomerOtpInput,
} from '@/services/baas/types'

/** Initiate a transfer. Returns a transfer with an id for OTP/approval flow. */
export async function createTransfer(
  payload: CreateTransferInput,
): Promise<Transfer> {
  const client = createBaasClient()
  const { data } = await client.post<Transfer>(
    '/api/v1/routeops/transfers',
    payload,
  )
  return data
}

/** Verify the customer's OTP for a pending transfer. */
export async function verifyCustomerOtp(
  id: string,
  payload: VerifyCustomerOtpInput,
): Promise<Transfer> {
  const client = createBaasClient()
  const { data } = await client.post<Transfer>(
    `/api/v1/routeops/transfers/${id}/verify-customer-otp`,
    payload,
  )
  return data
}

/** Approve a transfer as a checker. */
export async function approveTransfer(
  id: string,
  payload: ApproveTransferInput,
): Promise<Transfer> {
  const client = createBaasClient()
  const { data } = await client.post<Transfer>(
    `/api/v1/routeops/transfers/${id}/approve`,
    payload,
  )
  return data
}

/** Verify the checker's (approval) OTP for an approved transfer. */
export async function verifyApprovalOtp(
  id: string,
  payload: VerifyApprovalOtpInput,
): Promise<Transfer> {
  const client = createBaasClient()
  const { data } = await client.post<Transfer>(
    `/api/v1/routeops/transfers/${id}/verify-approval-otp`,
    payload,
  )
  return data
}

/** Reject a transfer with a reason. */
export async function rejectTransfer(
  id: string,
  payload: RejectTransferInput,
): Promise<Transfer> {
  const client = createBaasClient()
  const { data } = await client.post<Transfer>(
    `/api/v1/routeops/transfers/${id}/reject`,
    payload,
  )
  return data
}

/** Fetch the pending approvals queue. */
export async function getApprovalQueue(
  params: ApprovalQueueParams = {},
): Promise<Transfer[]> {
  const client = createBaasClient()
  const { data } = await client.get<Transfer[]>(
    '/api/v1/routeops/queue/approvals',
    { params },
  )
  return data
}
