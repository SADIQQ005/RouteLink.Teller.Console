import { ApiError } from '@/services/http'
import * as statsService from '@/services/stats'
import * as transactionsService from '@/services/transactions'
import * as approvalsService from '@/services/approvals'
import type { ApprovalsResult } from '@/services/approvals'
import type { ApprovalQueueParams } from '@/services/baas/types'

function isOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0
}

export type TransactionStatus = 'Pending' | 'Success' | 'Failed'
export type TransactionType = 'Credit' | 'Debit'

export interface Transaction {
  id: string
  reference: string
  beneficiary: string
  description: string
  account: string
  amount: number
  currency: string
  type: TransactionType
  status: TransactionStatus
  method: string
  initiatedBy: string
  date: string
  documents?: string[]
}

export interface ApprovalItem {
  id: string
  reference: string
  beneficiary: string
  beneficiaryAccount: string
  beneficiaryBank: string
  sourceAccount: string
  amount: number
  currency: string
  type: TransactionType
  initiatedBy: string
  tier: number
  requiredTier: number
  priority: 'High' | 'Medium' | 'Low'
  submittedAt: string
  method: string
  narration: string
  documents?: string[]
}

export interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  branch: string
  tier: string
  status: 'Active' | 'Inactive' | 'Suspended'
  lastLogin: string
}

export interface TransactionLimit {
  id: string
  name: string
  tier: string
  dailyLimit: number
  singleLimit: number
  monthlyLimit: number
  currency: string
  requiresApproval: boolean
  updatedAt: string
}

export interface ApprovalRole {
  id: string
  name: string
  tier: number
  members: number
  permissions: string[]
  status: 'Active' | 'Disabled'
  updatedAt: string
}

export interface AuditEntry {
  id: string
  action: string
  module: string
  actor: string
  ipAddress: string
  outcome: 'Success' | 'Failed'
  timestamp: string
}

export interface ReconciliationItem {
  id: string
  batch: string
  date: string
  expected: number
  matched: number
  discrepancy: number
  currency: string
  status: 'Matched' | 'Pending' | 'Discrepancy'
}

export interface DashboardStats {
  balance: number
  inflowToday: number
  outflowToday: number
  pendingApprovals: number
  inflowDelta: number
  outflowDelta: number
  approvalDelta: number
}

export interface AccountBalance {
  accountNumber: string
  accountName: string
  balance: number
  currency: string
}

const SOURCE_ACCOUNT_NAMES = [
  'Alhaji Musa Ibrahim Stores',
  'Chinedu Okafor & Co.',
  'Bright Future Academy',
  'Adeola & Sons Trading',
  'Zenith Motors Ltd',
  'Mega Foods Distribution Co.',
  'Sunshine Agro Allied Ltd',
  'BlueRidge Consult Limited',
]

const balances: Record<string, number> = {}

function balanceFor(accountNumber: string): number {
  if (balances[accountNumber] === undefined) {
    const num = Number(accountNumber) || 0
    balances[accountNumber] = (num % 5_000_000) + 250_000
  }
  return balances[accountNumber]
}

let transactions: Transaction[] = []

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let approvals: ApprovalItem[] = []

export const api = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      return await statsService.getStats()
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(450)
    return {
      balance: 0,
      inflowToday: 0,
      outflowToday: 0,
      pendingApprovals: approvals.length,
      inflowDelta: 0,
      outflowDelta: 0,
      approvalDelta: 0,
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      return await transactionsService.getTransactions()
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(600)
    return transactions
  },

  accountLookup: async (accountNumber: string): Promise<AccountBalance> => {
    try {
      return await transactionsService.getAccountBalance(accountNumber)
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(600)
    const num = Number(accountNumber) || 0
    return {
      accountNumber,
      accountName:
        SOURCE_ACCOUNT_NAMES[num % SOURCE_ACCOUNT_NAMES.length],
      balance: balanceFor(accountNumber),
      currency: 'NGN',
    }
  },

  getApprovals: async (
    params: ApprovalQueueParams = {},
  ): Promise<ApprovalsResult> => {
    try {
      return await approvalsService.getApprovals(params)
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(550)
    return {
      items: approvals,
      snapshot: {
        totalInQueue: approvals.length,
        totalVolumeInQueue: approvals.reduce((s, a) => s + a.amount, 0),
        awaitingYourActionCount: approvals.length,
        highPriorityCount: approvals.filter((a) => a.priority === 'High').length,
      },
      totalMatchingFilter: approvals.length,
      page: 1,
      pageSize: approvals.length,
    }
  },

  rejectApproval: async (id: string, reason: string) => {
    try {
      await approvalsService.rejectApproval(id, reason)
      return { id, decision: 'reject' as const }
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(700)
    const item = approvals.find((a) => a.id === id)
    if (item) {
      approvals = approvals.filter((a) => a.id !== id)
      transactions = transactions.map((t) =>
        t.reference === item.reference ? { ...t, status: 'Failed' } : t,
      )
    }
    return { id, decision: 'reject' as const }
  },

  getUsers: async (): Promise<UserRecord[]> => {
    await delay(500)
    return [
      { id: 'usr_001', name: 'Ada Okafor', email: 'adaeze.okafor@routelink.io', role: 'Senior Teller', branch: 'Head Office', tier: 'Maker', status: 'Active', lastLogin: '27 Aug 2026 · 09:14' },
      { id: 'usr_002', name: 'Emeka Nwosu', email: 'emeka.nwosu@routelink.io', role: 'Teller', branch: 'Victoria Island', tier: 'Maker', status: 'Active', lastLogin: '27 Aug 2026 · 08:40' },
      { id: 'usr_003', name: 'Bola Adeyemi', email: 'bola.adeyemi@routelink.io', role: 'Approval Officer', branch: 'Ikeja', tier: 'Checker', status: 'Active', lastLogin: '26 Aug 2026 · 17:02' },
      { id: 'usr_004', name: 'Chidi Obi', email: 'chidi.obi@routelink.io', role: 'Approval Officer II', branch: 'Head Office', tier: 'Checker', status: 'Active', lastLogin: '26 Aug 2026 · 15:48' },
      { id: 'usr_005', name: 'Fatima Musa', email: 'fatima.musa@routelink.io', role: 'Branch Manager', branch: 'Ikeja', tier: 'Administrator', status: 'Active', lastLogin: '26 Aug 2026 · 13:20' },
      { id: 'usr_006', name: 'Yusuf Balogun', email: 'yusuf.balogun@routelink.io', role: 'Operations Head', branch: 'Head Office', tier: 'Administrator', status: 'Active', lastLogin: '25 Aug 2026 · 18:11' },
      { id: 'usr_007', name: 'Ngozi Eze', email: 'ngozi.eze@routelink.io', role: 'Teller', branch: 'Lekki', tier: 'Maker', status: 'Inactive', lastLogin: '18 Aug 2026 · 12:30' },
      { id: 'usr_008', name: 'Samuel Kalu', email: 'samuel.kalu@routelink.io', role: 'Audit Officer', branch: 'Head Office', tier: 'Checker', status: 'Suspended', lastLogin: '12 Aug 2026 · 10:05' },
    ]
  },

  getLimits: async (): Promise<TransactionLimit[]> => {
    await delay(420)
    return [
      { id: 'lim_01', name: 'Single Maker Limit', tier: 'Maker', dailyLimit: 10000000, singleLimit: 2500000, monthlyLimit: 80000000, currency: 'NGN', requiresApproval: true, updatedAt: '20 Aug 2026' },
      { id: 'lim_02', name: 'Batch Maker Limit', tier: 'Maker', dailyLimit: 25000000, singleLimit: 5000000, monthlyLimit: 150000000, currency: 'NGN', requiresApproval: true, updatedAt: '20 Aug 2026' },
      { id: 'lim_03', name: 'Checker Approval Cap', tier: 'Checker', dailyLimit: 50000000, singleLimit: 15000000, monthlyLimit: 250000000, currency: 'NGN', requiresApproval: false, updatedAt: '19 Aug 2026' },
      { id: 'lim_04', name: 'Checker II Approval Cap', tier: 'Checker', dailyLimit: 100000000, singleLimit: 30000000, monthlyLimit: 500000000, currency: 'NGN', requiresApproval: false, updatedAt: '19 Aug 2026' },
      { id: 'lim_05', name: 'Administrator Cap', tier: 'Administrator', dailyLimit: 500000000, singleLimit: 150000000, monthlyLimit: 2000000000, currency: 'NGN', requiresApproval: false, updatedAt: '18 Aug 2026' },
      { id: 'lim_06', name: 'FX Outward Transfer', tier: 'Maker', dailyLimit: 250000, singleLimit: 100000, monthlyLimit: 1000000, currency: 'USD', requiresApproval: true, updatedAt: '15 Aug 2026' },
    ]
  },

  getRoles: async (): Promise<ApprovalRole[]> => {
    await delay(450)
    return [
      { id: 'role_01', name: 'Teller — Maker', tier: 1, members: 12, permissions: ['Initiate Transaction', 'Create Batch', 'View Balance'], status: 'Active', updatedAt: '20 Aug 2026' },
      { id: 'role_02', name: 'Maker — Checker I', tier: 2, members: 8, permissions: ['Initiate Transaction', 'Approve Tier 1', 'Reverse Transaction'], status: 'Active', updatedAt: '19 Aug 2026' },
      { id: 'role_03', name: 'Checker II — Supervisory', tier: 3, members: 4, permissions: ['Approve Tier 2', 'Reject Transaction', 'Override Limits'], status: 'Active', updatedAt: '18 Aug 2026' },
      { id: 'role_04', name: 'Branch Administrator', tier: 4, members: 6, permissions: ['Manage Users', 'Configure Limits', 'Approve Tier 3'], status: 'Active', updatedAt: '16 Aug 2026' },
      { id: 'role_05', name: 'System Administrator', tier: 4, members: 2, permissions: ['Full Access', 'Audit Export', 'Manage Roles'], status: 'Active', updatedAt: '14 Aug 2026' },
      { id: 'role_06', name: 'Audit Read-Only', tier: 0, members: 3, permissions: ['View Audit Trail', 'Export Reports'], status: 'Disabled', updatedAt: '02 Aug 2026' },
    ]
  },

  getAuditTrail: async (): Promise<AuditEntry[]> => {
    await delay(520)
    return [
      { id: 'aud_01', action: 'Transaction Approved', module: 'Payments', actor: 'Bola Adeyemi', ipAddress: '10.12.4.22', outcome: 'Success', timestamp: '27 Aug 2026 · 08:44' },
      { id: 'aud_02', action: 'Transaction Initiated', module: 'Payments', actor: 'Ada Okafor', ipAddress: '10.12.1.17', outcome: 'Success', timestamp: '27 Aug 2026 · 08:42' },
      { id: 'aud_03', action: 'Login Failed', module: 'Authentication', actor: '—', ipAddress: '41.190.88.12', outcome: 'Failed', timestamp: '27 Aug 2026 · 08:31' },
      { id: 'aud_04', action: 'User Created', module: 'Administration', actor: 'Yusuf Balogun', ipAddress: '10.12.1.9', outcome: 'Success', timestamp: '26 Aug 2026 · 18:02' },
      { id: 'aud_05', action: 'Transaction Rejected', module: 'Payments', actor: 'Chidi Obi', ipAddress: '10.12.2.31', outcome: 'Success', timestamp: '26 Aug 2026 · 16:57' },
      { id: 'aud_06', action: 'Limit Updated', module: 'Administration', actor: 'Fatima Musa', ipAddress: '10.12.4.11', outcome: 'Success', timestamp: '26 Aug 2026 · 13:22' },
      { id: 'aud_07', action: '2FA Enrollment', module: 'Security', actor: 'Ada Okafor', ipAddress: '10.12.1.17', outcome: 'Success', timestamp: '26 Aug 2026 · 10:05' },
      { id: 'aud_08', action: 'Export Requested', module: 'Reconciliation', actor: 'Samuel Kalu', ipAddress: '10.12.3.44', outcome: 'Failed', timestamp: '25 Aug 2026 · 14:18' },
    ]
  },

  getReconciliation: async (): Promise<ReconciliationItem[]> => {
    await delay(560)
    return [
      { id: 'rec_01', batch: 'REC-0826-001', date: '26 Aug 2026', expected: 48200000, matched: 48200000, discrepancy: 0, currency: 'NGN', status: 'Matched' },
      { id: 'rec_02', batch: 'REC-0826-002', date: '26 Aug 2026', expected: 17800000, matched: 17720000, discrepancy: 80000, currency: 'NGN', status: 'Discrepancy' },
      { id: 'rec_03', batch: 'REC-0825-001', date: '25 Aug 2026', expected: 51300000, matched: 51300000, discrepancy: 0, currency: 'NGN', status: 'Matched' },
      { id: 'rec_04', batch: 'REC-0825-002', date: '25 Aug 2026', expected: 9200000, matched: 8600000, discrepancy: 600000, currency: 'NGN', status: 'Discrepancy' },
      { id: 'rec_05', batch: 'REC-0824-001', date: '24 Aug 2026', expected: 66100000, matched: 0, discrepancy: 0, currency: 'NGN', status: 'Pending' },
      { id: 'rec_06', batch: 'REC-0824-002', date: '24 Aug 2026', expected: 38100000, matched: 38100000, discrepancy: 0, currency: 'NGN', status: 'Matched' },
      { id: 'rec_07', batch: 'REC-0823-001', date: '23 Aug 2026', expected: 45200000, matched: 1200000, discrepancy: 0, currency: 'NGN', status: 'Pending' },
      { id: 'rec_08', batch: 'REC-0823-002', date: '23 Aug 2026', expected: 23900000, matched: 23900000, discrepancy: 0, currency: 'NGN', status: 'Matched' },
    ]
  },
}