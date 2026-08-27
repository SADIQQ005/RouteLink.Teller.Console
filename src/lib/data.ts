import { ApiError } from '@/services/http'
import * as statsService from '@/services/stats'
import * as transactionsService from '@/services/transactions'
import * as approvalsService from '@/services/approvals'

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

let transactions: Transaction[] = [
  {
    id: 'txn_01',
    reference: 'TRX-260827-0142',
    beneficiary: 'Zenith Steel Works Ltd',
    description: 'Supplier invoice #INV-8821',
    account: '•• 4021',
    amount: 8450000,
    currency: 'NGN',
    type: 'Debit',
    status: 'Success',
    method: 'RTGS',
    initiatedBy: 'Ada Okafor',
    date: '27 Aug 2026 · 08:42',
  },
  {
    id: 'txn_02',
    reference: 'TRX-260827-0139',
    beneficiary: 'Dangote Cement Plc',
    description: 'Bulk purchase — June',
    account: '•• 2107',
    amount: 24500000,
    currency: 'NGN',
    type: 'Debit',
    status: 'Pending',
    method: 'NEFT',
    initiatedBy: 'Emeka Nwosu',
    date: '27 Aug 2026 · 08:12',
  },
  {
    id: 'txn_03',
    reference: 'TRX-260827-0120',
    beneficiary: 'Airtel Networks',
    description: 'Corporate data services',
    account: '•• 9033',
    amount: 1200000,
    currency: 'NGN',
    type: 'Debit',
    status: 'Success',
    method: 'Direct Debit',
    initiatedBy: 'Ada Okafor',
    date: '27 Aug 2026 · 07:28',
  },
  {
    id: 'txn_04',
    reference: 'TRX-260826-0518',
    beneficiary: 'Interswitch Ltd',
    description: 'Settlement — POS network',
    account: '•• 7741',
    amount: 4832000,
    currency: 'NGN',
    type: 'Credit',
    status: 'Success',
    method: 'Settlement',
    initiatedBy: 'System',
    date: '26 Aug 2026 · 19:05',
  },
  {
    id: 'txn_05',
    reference: 'TRX-260826-0466',
    beneficiary: 'Kuda Microfinance',
    description: 'Agent float top-up',
    account: '•• 1180',
    amount: 950000,
    currency: 'NGN',
    type: 'Debit',
    status: 'Failed',
    method: 'NEFT',
    initiatedBy: 'Bola Adeyemi',
    date: '26 Aug 2026 · 16:44',
  },
  {
    id: 'txn_06',
    reference: 'TRX-260826-0401',
    beneficiary: 'First Bank Plc',
    description: 'NIBSS settlement',
    account: '•• 6233',
    amount: 12600400,
    currency: 'NGN',
    type: 'Credit',
    status: 'Success',
    method: 'Settlement',
    initiatedBy: 'System',
    date: '26 Aug 2026 · 14:02',
  },
  {
    id: 'txn_07',
    reference: 'TRX-260826-0335',
    beneficiary: 'Union Homes REIT',
    description: 'Monthly rental transfer',
    account: '•• 8850',
    amount: 2850000,
    currency: 'NGN',
    type: 'Debit',
    status: 'Success',
    method: 'RTGS',
    initiatedBy: 'Ada Okafor',
    date: '26 Aug 2026 · 11:31',
  },
  {
    id: 'txn_08',
    reference: 'TRX-260825-0482',
    beneficiary: 'MTN Nigeria',
    description: 'Enterprise voice & data',
    account: '•• 3090',
    amount: 975000,
    currency: 'NGN',
    type: 'Debit',
    status: 'Success',
    method: 'Direct Debit',
    initiatedBy: 'Emeka Nwosu',
    date: '25 Aug 2026 · 17:20',
  },
  {
    id: 'txn_09',
    reference: 'TRX-260825-0420',
    beneficiary: 'Paystack Ltd',
    description: 'Merchant settlement batch',
    account: '•• 7706',
    amount: 8020000,
    currency: 'NGN',
    type: 'Credit',
    status: 'Pending',
    method: 'Settlement',
    initiatedBy: 'System',
    date: '25 Aug 2026 · 13:55',
  },
  {
    id: 'txn_10',
    reference: 'TRX-260825-0361',
    beneficiary: 'TotalEnergies',
    description: 'Fleet fuel card recharge',
    account: '•• 5519',
    amount: 440000,
    currency: 'NGN',
    type: 'Debit',
    status: 'Success',
    method: 'NEFT',
    initiatedBy: 'Bola Adeyemi',
    date: '25 Aug 2026 · 10:09',
  },
]

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface CreateTransactionInput {
  beneficiary: string
  description: string
  account: string
  amount: number
  currency: string
  type: TransactionType
  method: string
  initiatedBy: string
  documents?: string[]
  beneficiaryAccount?: string
  beneficiaryBank?: string
}

const TIER_2_LIMIT = 5_000_000
const TIER_3_LIMIT = 25_000_000
const HIGH_PRIORITY = 10_000_000
const MED_PRIORITY = 5_000_000

let approvals: ApprovalItem[] = [
  {
    id: 'app_01',
    reference: 'TRX-260827-0139',
    beneficiary: 'Dangote Cement Plc',
    amount: 24500000,
    currency: 'NGN',
    type: 'Debit',
    initiatedBy: 'Emeka Nwosu',
    tier: 1,
    requiredTier: 2,
    priority: 'High',
    submittedAt: '27 Aug 2026 · 08:12',
    method: 'Instant',
    narration: 'Cement supply — invoice INV-2241',
    sourceAccount: '0001733301',
    beneficiaryAccount: '2091112223',
    beneficiaryBank: 'Zenith Bank Plc',
    documents: ['dangote-invoice-INV-2241.pdf', 'supply-agreement-signed.pdf'],
  },
  {
    id: 'app_02',
    reference: 'TRX-260825-0420',
    beneficiary: 'Paystack Ltd',
    amount: 8020000,
    currency: 'NGN',
    type: 'Credit',
    initiatedBy: 'System',
    tier: 1,
    requiredTier: 2,
    priority: 'Medium',
    submittedAt: '27 Aug 2026 · 08:05',
    method: 'NEFT',
    narration: 'Interbank reversal — batch RT-0826',
    sourceAccount: '0007733309',
    beneficiaryAccount: '0123412205',
    beneficiaryBank: 'Access Bank Plc',
    documents: ['reversal-memo-RT-0826.pdf'],
  },
  {
    id: 'app_03',
    reference: 'TRX-260824-0288',
    beneficiary: 'FCMB Reinsurance',
    amount: 5600000,
    currency: 'NGN',
    type: 'Debit',
    initiatedBy: 'Bola Adeyemi',
    tier: 2,
    requiredTier: 3,
    priority: 'High',
    submittedAt: '24 Aug 2026 · 15:40',
    method: 'RTGS',
    narration: 'Premium remittance — Q3 portfolio',
    sourceAccount: '0001234021',
    beneficiaryAccount: '2130447718',
    beneficiaryBank: 'First Bank of Nigeria',
    documents: ['premium-remittance-q3.pdf', 'insurance-debit-note.pdf'],
  },
  {
    id: 'app_04',
    reference: 'TRX-260824-0254',
    beneficiary: 'Lagos State IGR',
    amount: 12300000,
    currency: 'NGN',
    type: 'Debit',
    initiatedBy: 'Ada Okafor',
    tier: 1,
    requiredTier: 2,
    priority: 'Medium',
    submittedAt: '24 Aug 2026 · 11:02',
    method: 'Direct Debit',
    narration: 'Statutory levy payment',
    sourceAccount: '0001234021',
    beneficiaryAccount: '1012033344',
    beneficiaryBank: 'Union Bank Plc',
    documents: ['statutory-levy-assessment.pdf'],
  },
  {
    id: 'app_05',
    reference: 'TRX-260823-0411',
    beneficiary: 'Glovo Logistics',
    amount: 1950000,
    currency: 'NGN',
    type: 'Credit',
    initiatedBy: 'System',
    tier: 2,
    requiredTier: 2,
    priority: 'Low',
    submittedAt: '23 Aug 2026 · 18:20',
    method: 'NEFT',
    narration: 'Settlement — delivery partners',
    sourceAccount: '0007733309',
    beneficiaryAccount: '0178801221',
    beneficiaryBank: 'GTBank Plc',
    documents: ['settlement-schedule-GLV-0411.pdf'],
  },
  {
    id: 'app_06',
    reference: 'TRX-260823-0322',
    beneficiary: 'Sovereign Trust Ins.',
    amount: 3400000,
    currency: 'NGN',
    type: 'Debit',
    initiatedBy: 'Emeka Nwosu',
    tier: 1,
    requiredTier: 3,
    priority: 'High',
    submittedAt: '23 Aug 2026 · 09:47',
    method: 'RTGS',
    narration: 'Insurance premium — fleet policy',
    sourceAccount: '0001733301',
    beneficiaryAccount: '0288791120',
    beneficiaryBank: 'Sterling Bank Plc',
    documents: ['fleet-policy-certificate.pdf'],
  },
  {
    id: 'app_07',
    reference: 'TRX-260822-0470',
    beneficiary: 'Wema Bank Interbank',
    amount: 7100000,
    currency: 'NGN',
    type: 'Credit',
    initiatedBy: 'System',
    tier: 2,
    requiredTier: 2,
    priority: 'Low',
    submittedAt: '22 Aug 2026 · 16:33',
    method: 'NEFT',
    narration: 'Interbank transfer settlement',
    sourceAccount: '0007733309',
    beneficiaryAccount: '0112258890',
    beneficiaryBank: 'Wema Bank Plc',
    documents: ['interbank-settlement-schedule.pdf'],
  },
]

export const api = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      return await statsService.getStats()
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(450)
    return {
      balance: 1864500000,
      inflowToday: 25400000,
      outflowToday: 18200000,
      pendingApprovals: approvals.length,
      inflowDelta: 12.4,
      outflowDelta: -3.2,
      approvalDelta: 2,
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

  createTransaction: async (
    payload: CreateTransactionInput,
  ): Promise<Transaction> => {
    try {
      return await transactionsService.createTransaction(payload)
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(900)
    const created: Transaction = {
      beneficiary: payload.beneficiary,
      description: payload.description,
      account: payload.account,
      amount: payload.amount,
      currency: payload.currency,
      type: payload.type,
      method: payload.method,
      initiatedBy: payload.initiatedBy,
      documents: payload.documents,
      id: `txn_${Date.now()}`,
      reference: `TRX-260827-${String(Math.floor(1000 + Math.random() * 9000))}`,
      status: 'Pending',
      date: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    transactions = [created, ...transactions]

    // Route the transfer into the approval queue (maker → checker flow)
    const requiredTier =
      created.amount >= TIER_3_LIMIT ? 3 : created.amount >= TIER_2_LIMIT ? 2 : 1
    const priority =
      created.amount >= HIGH_PRIORITY
        ? ('High' as const)
        : created.amount >= MED_PRIORITY
          ? ('Medium' as const)
          : ('Low' as const)
    approvals = [
      {
        id: `app_${Date.now()}`,
        reference: created.reference,
        beneficiary: created.beneficiary,
        beneficiaryAccount: payload.beneficiaryAccount ?? '—',
        beneficiaryBank: payload.beneficiaryBank ?? '—',
        sourceAccount: payload.account,
        amount: created.amount,
        currency: created.currency,
        type: created.type,
        initiatedBy: created.initiatedBy,
        tier: 1,
        requiredTier,
        priority,
        submittedAt: created.date,
        method: created.method,
        narration: created.description || 'Bank account transfer',
      },
      ...approvals,
    ]
    return created
  },

  updateTransactionStatus: async (
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> => {
    try {
      return await transactionsService.setTransactionStatus(id, status)
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(400)
    transactions = transactions.map((t) => (t.id === id ? { ...t, status } : t))
    return transactions.find((t) => t.id === id)!
  },

getApprovals: async (): Promise<ApprovalItem[]> => {
    try {
      return await approvalsService.getApprovals()
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(550)
    return approvals
  },

  resolveApproval: async (id: string, decision: 'approve' | 'reject') => {
    try {
      await approvalsService.resolveApproval(id, decision)
      return { id, decision }
    } catch (error) {
      if (!isOffline(error)) throw error
    }
    await delay(700)
    const item = approvals.find((a) => a.id === id)
    if (item) {
      approvals = approvals.filter((a) => a.id !== id)
      transactions = transactions.map((t) =>
        t.reference === item.reference
          ? { ...t, status: decision === 'approve' ? 'Success' : 'Failed' }
          : t,
      )
    }
    return { id, decision }
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