/** A single bank available in the BaaS bank list. */
export interface Bank {
  bankCode: string
  bankName: string
}

/**
 * Request body for initiating a transfer.
 *
 * @property transferType - Type of transfer. Map to the enum before sending:
 *   `0` = ? (see BaaS contract), values may be extended by the backend.
 */
export interface CreateTransferInput {
  debitAccountNumber: string
  beneficiaryAccountNumber: string
  beneficiaryBankCode: string
  amount: number
  narration: string
  transferType: number
}

/** Response returned by the BaaS transfer endpoint. */
export interface Transfer {
  id: string
  // Additional fields are populated by the BaaS contract as they become
  // available during implementation.
  [key: string]: unknown
}

/** Body for verifying the customer OTP on a pending transfer. */
export interface VerifyCustomerOtpInput {
  code: string
}

/** Body for approving a transfer as a checker. */
export interface ApproveTransferInput {
  checkerEmail: string
}

/** Body for verifying the checker (approval) OTP. */
export interface VerifyApprovalOtpInput {
  code: string
}

/** Body for rejecting a transfer. */
export interface RejectTransferInput {
  reason: string
}

/** Priority filter for the approvals queue. */
export const QueuePriority = {
  Low: 0,
  Medium: 1,
  High: 2,
} as const

export type QueuePriority = (typeof QueuePriority)[keyof typeof QueuePriority]

/** Query parameters for the approvals queue endpoint. */
export interface ApprovalQueueParams {
  /** Optional priority filter: 0 = Low, 1 = Medium, 2 = High. */
  priority?: QueuePriority
  /** Page number, defaults to 1. */
  page?: number
  /** Page size, defaults to 20. */
  pageSize?: number
}
