import { http } from '@/services/http'
import { createTransfer } from '@/services/baas/transfers'
import { TransferType, type TransferType as TransferTypeValue, type Transfer } from '@/services/baas/types'
import type {
  AccountBalance,
  Transaction,
} from '@/lib/data'

/**
 * List transactions. No dedicated BaaS (routeops) endpoint exists for this
 * yet, so it continues to use the first-party API client.
 */
export function getTransactions(): Promise<Transaction[]> {
  return http.get<Transaction[]>('/transactions')
}

export interface InitiateTransferInput {
  account: string
  beneficiaryAccount: string
  beneficiaryBank: string
  amount: number
  description: string
  transferType?: number
}

/**
 * Initiate a transfer via the BaaS API only. The backend immediately sends a
 * 6-digit OTP to the customer's phone; the masked destination is returned so
 * the consent screen can show it.
 * Mapped to: POST /api/v1/routeops/transfers
 */
export function initiateTransfer(
  payload: InitiateTransferInput,
): Promise<Transfer> {
  return createTransfer({
    debitAccountNumber: payload.account,
    beneficiaryAccountNumber: payload.beneficiaryAccount ?? '',
    beneficiaryBankCode: payload.beneficiaryBank ?? '',
    amount: payload.amount,
    narration: payload.description,
    transferType: (payload.transferType ??
      TransferType.IntraBank) as TransferTypeValue,
  })
}

/**
 * Look up an account balance. No dedicated BaaS (routeops) endpoint exists
 * for this yet, so it continues to use the first-party API client.
 */
export function getAccountBalance(
  accountNumber: string,
): Promise<AccountBalance> {
  return http.get<AccountBalance>(`/accounts/${accountNumber}/balance`)
}
