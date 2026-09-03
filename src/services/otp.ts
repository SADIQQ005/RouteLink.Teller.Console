import { ApiError, http } from '@/services/http'

export type OtpOperation = 'customer-transfer' | 'checker-approval'

export interface SendCustomerOtpInput {
  sourceAccount: string
  beneficiaryAccount: string
  amount: number
  customerPhone?: string
}

export interface SendCheckerOtpInput {
  checkerUserId: string
  checkerEmail: string
  transactionIds: string[]
  references: string[]
}

export interface SendOtpResponse {
  otpId: string
  sentTo: string
  expiresAt: string
  resendAfter: number
}

export interface VerifyOtpInput {
  otpId: string
  code: string
}

export interface VerifyOtpResponse {
  valid: boolean
  message?: string
}

interface OtpStoreEntry {
  code: string
  operation: OtpOperation
  createdAt: number
  expiresAt: number
  consumed: boolean
  attempts: number
  context: string
}

const OTP_TTL_MS = 5 * 60 * 1000
const OTP_RESEND_MS = 30 * 1000
const MAX_ATTEMPTS = 5

const DEMO_MASTER_OTP = '123456'

const demoStore = new Map<string, OtpStoreEntry>()

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function maskContact(contact: string, kind: 'phone' | 'email' = 'phone'): string {
  if (kind === 'email') {
    const [local, domain] = contact.split('@')
    if (!local || !domain) return contact
    const visible = Math.min(2, local.length)
    return `${local.slice(0, visible)}${'*'.repeat(Math.max(3, local.length - visible))}@${domain}`
  }
  const digits = contact.replace(/\D/g, '')
  if (digits.length < 7) return contact
  const prefix = digits.slice(0, Math.max(3, digits.length - 7))
  const suffix = digits.slice(-4)
  const middleLen = digits.length - prefix.length - suffix.length
  return `+${digits.slice(0, 3)} ${'*'.repeat(middleLen || 3)} ${suffix}`
}

function phoneForAccount(sourceAccount: string): string {
  const num = Number(sourceAccount) || 0
  const last7 = (num % 10_000_000).toString().padStart(7, '0')
  return `+23480${last7.slice(0, 3)}${last7.slice(3)}`
}

function phoneForUser(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0
  const abs = Math.abs(hash)
  return `+23480${String(abs % 10_000_000).padStart(7, '0')}`
}

function contextHash(context: Record<string, unknown>): string {
  try {
    return JSON.stringify(context)
  } catch {
    return String(context)
  }
}

function cleanExpired(): void {
  const now = Date.now()
  for (const [id, entry] of demoStore.entries()) {
    if (entry.expiresAt < now) demoStore.delete(id)
  }
}

async function demoSendCustomerOtp(
  input: SendCustomerOtpInput,
): Promise<SendOtpResponse> {
  await new Promise((r) => setTimeout(r, 700))
  cleanExpired()
  const code = generateCode()
  const now = Date.now()
  const otpId = `otp_cust_${now}_${Math.random().toString(36).slice(2, 8)}`
  const rawPhone = input.customerPhone || phoneForAccount(input.sourceAccount)
  demoStore.set(otpId, {
    code,
    operation: 'customer-transfer',
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    consumed: false,
    attempts: 0,
    context: contextHash({
      sourceAccount: input.sourceAccount,
      beneficiaryAccount: input.beneficiaryAccount,
      amount: input.amount,
    }),
  })
  console.info(
    `%c[DEMO OTP → Customer]%c CODE=%c${code}%c  (also accepts demo master code: ${DEMO_MASTER_OTP})  TTL=5min`,
    'color:#0ea5e9;font-weight:bold',
    'color:inherit',
    'color:#f97316;font-weight:bold;font-size:14px',
    'color:inherit',
  )
  console.log(
    `%c👆 For quick testing, just type: ${DEMO_MASTER_OTP}`,
    'background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:6px;font-weight:bold',
  )
  return {
    otpId,
    sentTo: maskContact(rawPhone, 'phone'),
    expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
    resendAfter: OTP_RESEND_MS,
  }
}

async function demoSendCheckerOtp(
  input: SendCheckerOtpInput,
): Promise<SendOtpResponse> {
  await new Promise((r) => setTimeout(r, 700))
  cleanExpired()
  const code = generateCode()
  const now = Date.now()
  const otpId = `otp_chk_${now}_${Math.random().toString(36).slice(2, 8)}`
  const rawPhone = phoneForUser(input.checkerEmail)
  demoStore.set(otpId, {
    code,
    operation: 'checker-approval',
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    consumed: false,
    attempts: 0,
    context: contextHash({
      checkerUserId: input.checkerUserId,
      transactionIds: [...input.transactionIds].sort().join('|'),
    }),
  })
  console.info(
    `%c[DEMO OTP → Checker]%c CODE=%c${code}%c  (also accepts demo master code: ${DEMO_MASTER_OTP})  TTL=5min`,
    'color:#10b981;font-weight:bold',
    'color:inherit',
    'color:#f97316;font-weight:bold;font-size:14px',
    'color:inherit',
  )
  console.log(
    `%c👆 For quick testing, just type: ${DEMO_MASTER_OTP}`,
    'background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:6px;font-weight:bold',
  )
  return {
    otpId,
    sentTo: maskContact(rawPhone, 'phone'),
    expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
    resendAfter: OTP_RESEND_MS,
  }
}

async function demoVerifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResponse> {
  await new Promise((r) => setTimeout(r, 350))
  cleanExpired()
  const entry = demoStore.get(input.otpId)
  if (!entry) {
    return { valid: false, message: 'OTP session not found. Please request a new code.' }
  }
  if (entry.consumed) {
    return { valid: false, message: 'This OTP has already been used. Request a new one.' }
  }
  if (Date.now() > entry.expiresAt) {
    demoStore.delete(input.otpId)
    return { valid: false, message: 'OTP has expired. Request a new code.' }
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.consumed = true
    return { valid: false, message: 'Too many failed attempts. Request a new OTP.' }
  }
  entry.attempts += 1
  if (input.code === DEMO_MASTER_OTP) {
    entry.consumed = true
    console.info(
      `%c[DEMO] Accepted master OTP ${DEMO_MASTER_OTP} for ${entry.operation}`,
      'color:#f59e0b;font-weight:bold',
    )
    return { valid: true }
  }
  if (input.code !== entry.code) {
    return {
      valid: false,
      message: `Incorrect OTP. ${MAX_ATTEMPTS - entry.attempts} attempt${MAX_ATTEMPTS - entry.attempts === 1 ? '' : 's'} remaining.`,
    }
  }
  entry.consumed = true
  return { valid: true }
}

export async function sendCustomerOtp(
  input: SendCustomerOtpInput,
): Promise<SendOtpResponse> {
  try {
    return await http.post<SendOtpResponse>('/otp/send-customer', input)
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      return demoSendCustomerOtp(input)
    }
    throw error
  }
}

export async function sendCheckerOtp(
  input: SendCheckerOtpInput,
): Promise<SendOtpResponse> {
  try {
    return await http.post<SendOtpResponse>('/otp/send-checker', input)
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      return demoSendCheckerOtp(input)
    }
    throw error
  }
}

export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResponse> {
  try {
    return await http.post<VerifyOtpResponse>('/otp/verify', input)
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      return demoVerifyOtp(input)
    }
    throw error
  }
}
