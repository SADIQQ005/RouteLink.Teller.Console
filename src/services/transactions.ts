import { http } from '@/services/http'
import { createTransfer } from '@/services/baas/transfers'
import type {
  AccountBalance,
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
} from '@/lib/data'

/**
 * List transactions. No dedicated BaaS (routeops) endpoint exists for this
 * yet, so it continues to use the first-party API client.
 */
export function getTransactions(): Promise<Transaction[]> {
  return http.get<Transaction[]>('/transactions')
}

/**
 * Initiate a transfer via the BaaS API.
 * Mapped to: POST /api/v1/routeops/transfers
 */
export function createTransaction(
  payload: CreateTransactionInput,
): Promise<Transaction> {
  return createTransfer({
    debitAccountNumber: payload.account,
    beneficiaryAccountNumber: payload.beneficiaryAccount ?? '',
    beneficiaryBankCode: payload.beneficiaryBank ?? '',
    amount: payload.amount,
    narration: payload.description,
    transferType: 0,
  }) as unknown as Promise<Transaction>
}

/**
 * Update a transaction's status. No dedicated BaaS (routeops) endpoint
 * exists for this yet, so it continues to use the first-party API client.
 */
export function setTransactionStatus(
  id: string,
  status: TransactionStatus,
): Promise<Transaction> {
  return http.patch<Transaction>(`/transactions/${id}/status`, { status })
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
