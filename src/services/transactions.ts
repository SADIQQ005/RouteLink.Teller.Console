import { http } from '@/services/http'
import type {
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
} from '@/lib/data'

export function getTransactions(): Promise<Transaction[]> {
  return http.get<Transaction[]>('/transactions')
}

export function createTransaction(
  payload: CreateTransactionInput,
): Promise<Transaction> {
  return http.post<Transaction>('/transactions', payload)
}

export function setTransactionStatus(
  id: string,
  status: TransactionStatus,
): Promise<Transaction> {
  return http.patch<Transaction>(`/transactions/${id}/status`, { status })
}