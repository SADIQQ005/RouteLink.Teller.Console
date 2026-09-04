/** A single bank available in the BaaS bank list. */
export interface Bank {
  bankCode: string
  bankName: string
}

/** Type of transfer. Values mirror the backend `TransferType` enum. */
export const TransferType = {
  IntraBank: 0,
  InterBank: 1,
} as const

export type TransferType = (typeof TransferType)[keyof typeof TransferType]

export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  [TransferType.IntraBank]: 'Intra-bank',
  [TransferType.InterBank]: 'Inter-bank',
}

/**
 * Request body for initiating a transfer.
 *
 * @property transferType - Type of transfer; maps to the backend `TransferType` enum.
 */
export interface CreateTransferInput {
  debitAccountNumber: string
  beneficiaryAccountNumber: string
  beneficiaryBankCode: string
  amount: number
  narration: string
  transferType: TransferType
}

/** Envelope returned by the BaaS transfer endpoint. */
export interface CreateTransferResponse {
  succeeded: boolean
  value: {
    transferRequestId: string
    transactionReference: string
    debitCustomerName: string
    availableBalance: number
    beneficiaryName: string
    transferFee: number
    totalDebitAmount: number
    maskedPhoneForOtp: string
  }
  error: string
  errorCode: string
}

/** Response returned by the BaaS transfer endpoint, unwrapped to its `value`. */
export interface Transfer {
  transferRequestId: string
  transactionReference: string
  debitCustomerName: string
  availableBalance: number
  beneficiaryName: string
  transferFee: number
  totalDebitAmount: number
  maskedPhoneForOtp: string
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
  /** Page number. */
  page?: number
  /** Page size. */
  pageSize?: number
}

/** A single item in the approvals queue. */
export interface ApprovalQueueItem {
  id: string
  transactionReference: string
  makerUserId: string
  debitAccountNumber: string
  beneficiaryAccountNumber: string
  beneficiaryName: string
  amount: number
  priority: number
  createdAt: string
}

/** Envelope returned by the approvals queue endpoint. */
export interface ApprovalQueueResponse {
  snapshot: {
    totalInQueue: number
    totalVolumeInQueue: number
    awaitingYourActionCount: number
    highPriorityCount: number
  }
  items: ApprovalQueueItem[]
  totalMatchingFilter: number
  page: number
  pageSize: number
}
