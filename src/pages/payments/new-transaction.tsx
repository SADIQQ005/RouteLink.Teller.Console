import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  FileText,
  LoaderCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Separator } from '@/components/ui/separator'
import { useBanks } from '@/hooks/use-baas'
import { initiateTransfer } from '@/services/transactions'
import { verifyCustomerOtp } from '@/services/baas/transfers'
import type { Bank } from '@/services/baas'
import { TransferType, TRANSFER_TYPE_LABELS } from '@/services/baas/types'
import { formatCurrency } from '@/lib/format'
import { api } from '@/lib/data'

const FEE_RATE = 0.005

const ENQUIRY_NAMES = [
  'Alhaji Musa Ibrahim Stores',
  'Chinedu Okafor & Co.',
  'Bright Future Academy',
  'Adeola & Sons Trading',
  'Zenith Motors Ltd',
  'Mega Foods Distribution Co.',
  'Sunshine Agro Allied Ltd',
  'BlueRidge Consult Limited',
]

const ALLOWED = /\.(pdf|jpe?g|png)$/i

const MAX_DOCS = 5

const schema = z.object({
  sourceAccount: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit source account number'),
  beneficiaryName: z
    .string()
    .min(2, 'Run a name enquiry or enter the beneficiary name')
    .max(80, 'Name is too long'),
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit account number'),
  bank: z.string().min(1, 'Select the beneficiary bank'),
  transferType: z.enum(['0', '1']),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter the transfer amount' })
    .positive('Amount must be greater than zero'),
  narration: z.string().max(120, 'Keep narration under 120 characters').optional(),
})

type FormValues = z.infer<typeof schema>

type SourceLookup =
  | { status: 'idle' | 'looking-up' | 'resolved' }
  | { status: 'error'; message: string }

interface UploadedDoc {
  id: string
  name: string
  size: number
}

const defaultValues: FormValues = {
  sourceAccount: '',
  beneficiaryName: '',
  accountNumber: '',
  bank: '',
  transferType: String(TransferType.InterBank) as '0' | '1',
  amount: undefined as unknown as number,
  narration: '',
}

function formatAmountInput(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 2,
  }).format(value)
}

function parseAmountInput(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (cleaned === '' || cleaned === '.') return undefined
  const num = Number(cleaned)
  return Number.isNaN(num) ? undefined : num
}

export function NewTransactionPage() {
  const banksQuery = useBanks()

  /**
   * Fetch banks on render. If the initial fetch failed (network/502 etc.),
   * retry once when the user opens the bank selector. If the list is already
   * cached (previous successful load), no extra call is made on select.
   */
  function handleBankSelect() {
    if (banksQuery.status === 'error' && !banksQuery.data) {
      banksQuery.refetch()
    }
  }

  const bankOptions: Bank[] =
    banksQuery.data?.length ? banksQuery.data : []

  const enrichingBanks =
    banksQuery.status === 'pending' ||
    (banksQuery.status === 'error' && !banksQuery.data)

  const [enquiring, setEnquiring] = useState(false)
  const [enquiryName, setEnquiryName] = useState<string | null>(null)
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [docsError, setDocsError] = useState<string | null>(null)
  const [amountDisplay, setAmountDisplay] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [transferRequestId, setTransferRequestId] = useState<string | null>(null)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [sourceBalance, setSourceBalance] = useState<number | null>(null)
  const [sourceLookup, setSourceLookup] = useState<SourceLookup>({
    status: 'idle',
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const amount = form.watch('amount')
  const bank = form.watch('bank')
  const accountNumber = form.watch('accountNumber')
  const beneficiaryName = form.watch('beneficiaryName')
  const sourceAccount = form.watch('sourceAccount')

  const canEnquire = bank.length > 0 && accountNumber.length === 10
  const fee = Number.isFinite(Number(amount)) ? Number(amount) * FEE_RATE : 0
  const total = Number.isFinite(Number(amount)) ? Number(amount) + fee : 0

  useEffect(() => {
    if (sourceAccount.length !== 10) {
      setSourceBalance(null)
      setSourceLookup({ status: 'idle' })
      return
    }
    let active = true
    setSourceBalance(null)
    setSourceLookup({ status: 'looking-up' })
    api
      .accountLookup(sourceAccount)
      .then((result) => {
        if (!active) return
        setSourceBalance(result.balance)
        setSourceLookup({ status: 'resolved' })
      })
      .catch(() => {
        if (!active) return
        setSourceLookup({
          status: 'error',
          message: 'Could not look up this account. Check the number and try again.',
        })
      })
    return () => {
      active = false
    }
  }, [sourceAccount])

  const balanceResolved =
    sourceLookup.status === 'resolved' && sourceBalance !== null
  const insufficient =
    balanceResolved &&
    total > (sourceBalance ?? Number.POSITIVE_INFINITY)
  const lookingUp = sourceLookup.status === 'looking-up'

  async function handleEnquiry() {
    const valid = await form.trigger(['bank', 'accountNumber'])
    if (!valid) return
    setEnquiring(true)
    setEnquiryName(null)
    await new Promise((r) => setTimeout(r, 1100))
    const index =
      parseInt(form.getValues('accountNumber').slice(-2), 10) %
      ENQUIRY_NAMES.length
    const name = ENQUIRY_NAMES[index]
    setEnquiryName(name)
    form.setValue('beneficiaryName', name, { shouldValidate: true })
    setEnquiring(false)
  }

  function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((f) => ALLOWED.test(f.name))
    if (files.length === 0) {
      toast.error('Unsupported file', {
        description: 'Only PDF, JPG or PNG files are accepted.',
      })
      return
    }
    if (documents.length + files.length > MAX_DOCS) {
      toast.error(`Maximum ${MAX_DOCS} documents`, {
        description: 'Remove an existing document first.',
      })
      return
    }
    setDocuments((prev) => [
      ...prev,
      ...files.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: f.size,
      })),
    ])
    setDocsError(null)
  }

  async function requestSubmit(values: FormValues) {
    if (documents.length === 0) {
      setDocsError('Upload at least one supporting document')
      toast.error('Supporting document required', {
        description:
          'Add an invoice, mandate or approval letter before submitting.',
      })
      return
    }
    setOtpCode('')
    setTransferRequestId(null)
    setMaskedPhone('')
    setOtpError(null)
    setSendingOtp(true)
    try {
      const transfer = await initiateTransfer({
        account: values.sourceAccount,
        beneficiaryAccount: values.accountNumber,
        beneficiaryBank: values.bank,
        amount: Number(values.amount) || 0,
        description: values.narration || 'Bank transfer',
        transferType: Number(values.transferType),
      })
      setTransferRequestId(transfer.transferRequestId)
      setMaskedPhone(transfer.maskedPhoneForOtp)
      setOtpStep(true)
      toast.success('Verification code sent', {
        description: `A 6-digit code was sent to ${transfer.maskedPhoneForOtp}. Ask the customer to read it out.`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not initiate the transfer.'
      setOtpError(message)
      toast.error('Failed to initiate transfer', { description: message })
    } finally {
      setSendingOtp(false)
    }
  }

  async function confirmSubmit() {
    if (!transferRequestId) {
      setOtpError('Transfer session missing. Please resubmit.')
      return
    }
    if (otpCode.trim().length !== 6) {
      setOtpError('Enter the 6-digit code sent to the customer.')
      return
    }
    setOtpError(null)
    setSendingOtp(true)
    try {
      await verifyCustomerOtp(transferRequestId, { code: otpCode.trim() })
      toast.success('Transfer submitted', {
        description: `The transfer was verified and routed for approval.`,
      })
      form.reset(defaultValues)
      form.resetField('amount', {
        defaultValue: '' as unknown as number,
      })
      setAmountDisplay('')
      setDocuments([])
      setDocsError(null)
      setEnquiryName(null)
      setOtpStep(false)
      setOtpCode('')
      setTransferRequestId(null)
      setMaskedPhone('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OTP verification failed.'
      setOtpError(message)
      toast.error('Verification failed', { description: message })
    } finally {
      setSendingOtp(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transfer"
        description="Transfer funds from a branch account to any bank account in Nigeria."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,520px)_340px] xl:justify-between">
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 px-2.5 py-1 text-primary">
                <CircleDollarSign className="size-3" /> Bank transfer
              </Badge>
            </div>
            <CardTitle className="pt-2">Transfer details</CardTitle>
            <CardDescription>
              Complete the steps below — fields marked * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(requestSubmit)}
                className="grid gap-4"
              >
                {/* Source */}
                <section className="grid gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      1
                    </span>
                    <h3 className="text-sm font-semibold">Source account</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="sourceAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source account number *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="e.g. 0001234021"
                          />
                        </FormControl>
                        <FormDescription>
                          The branch account this transfer will be debited from.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {lookingUp && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
                      Checking account balance…
                    </p>
                  )}
                  {balanceResolved && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <BadgeCheck className="size-3.5 shrink-0" />
                      Balance {formatCurrency(sourceBalance ?? 0)} — available
                      to debit
                    </p>
                  )}
                  {sourceLookup.status === 'error' && (
                    <p
                      role="alert"
                      className="flex items-center gap-1.5 text-xs font-semibold text-destructive"
                    >
                      <AlertCircle className="size-3.5 shrink-0" />
                      {sourceLookup.message}
                    </p>
                  )}
                </section>

                <Separator />

                {/* Beneficiary */}
                <section className="grid gap-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        2
                      </span>
                      <h3 className="text-sm font-semibold">Beneficiary details</h3>
                    </div>
                    {enquiryName && (
                      <Badge className="gap-1 bg-emerald-600/90">
                        <BadgeCheck className="size-3" /> Name verified
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="bank"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficiary bank *</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              onOpenChange={(open) => {
                                if (open) handleBankSelect()
                              }}
                              disabled={enrichingBanks}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={
                                    enrichingBanks
                                      ? 'Loading banks…'
                                      : 'Select bank'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {bankOptions.length === 0 &&
                                  banksQuery.status === 'error' && (
                                    <div className="rounded-lg p-4 text-sm text-muted-foreground">
                                      Could not load banks.{' '}
                                      <button
                                        type="button"
                                        className="font-semibold text-primary underline-offset-2 hover:underline"
                                        onClick={() => banksQuery.refetch()}
                                      >
                                        Retry
                                      </button>
                                    </div>
                                  )}
                                {bankOptions.map((bank) => (
                                  <SelectItem key={bank.bankCode} value={bank.bankCode}>
                                    {bank.bankName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account number *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="10-digit account number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Confirm the beneficiary name with the bank before transferring.
                      </p>
                      <FormField
                        control={form.control}
                        name="beneficiaryName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                {...field}
                                placeholder={
                                  enquiring
                                    ? 'Fetching account name…'
                                    : 'Account name appears here after enquiry'
                                }
                                className="h-9 w-full bg-transparent text-[15px] font-semibold outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canEnquire || enquiring}
                      onClick={handleEnquiry}
                    >
                      {enquiring ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      {enquiring
                        ? 'Enquiring…'
                        : enquiryName
                          ? 'Re-run enquiry'
                          : 'Run name enquiry'}
                    </Button>
                  </div>
                  {enquiryName && beneficiaryName === enquiryName && (
                    <p className="text-xs font-medium text-emerald-600">
                      <BadgeCheck className="mr-1 inline size-3.5" />
                      Account name matched: {enquiryName}
                    </p>
                  )}
                </section>

                <Separator />

                {/* Amount */}
                <section className="grid gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      3
                    </span>
                    <h3 className="text-sm font-semibold">Amount</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="transferType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer type *</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select transfer type" />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(TRANSFER_TYPE_LABELS) as unknown as TransferType[]).map(
                                (key) => (
                                  <SelectItem key={key} value={String(key)}>
                                    {TRANSFER_TYPE_LABELS[key]}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer amount *</FormLabel>
                        <FormControl>
                          <div className="flex h-10 items-center gap-3 rounded-md border bg-card px-4 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/40">
                            <span className="text-xl font-bold text-foreground/50">
                              ₦
                            </span>
                            <input
                              ref={field.ref}
                              name={field.name}
                              type="text"
                              inputMode="decimal"
                              value={amountDisplay}
                              onBlur={(e) => {
                                setAmountDisplay(formatAmountInput(parseAmountInput(e.target.value)))
                                field.onBlur()
                              }}
                              onChange={(e) => {
                                const raw = e.target.value
                                setAmountDisplay(raw)
                                field.onChange(parseAmountInput(raw))
                              }}
                              placeholder="0.00"
                              className="h-9 w-full bg-transparent text-xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/60"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {balanceResolved && Number(amount ?? 0) > 0 && (
                    insufficient ? (
                      <p
                        role="alert"
                        className="flex items-center gap-1.5 text-xs font-semibold text-destructive"
                      >
                        <AlertCircle className="size-3.5 shrink-0" />
                        Insufficient balance — available{' '}
                        {formatCurrency(sourceBalance ?? 0)}, total debit{' '}
                        {formatCurrency(total)}.
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <BadgeCheck className="size-3.5 shrink-0" />
                        Sufficient balance —{' '}
                        {formatCurrency(sourceBalance ?? 0)} available to cover
                        the total debit.
                      </p>
                    )
                  )}
                </section>

                <Separator />

                <section className="grid gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      4
                    </span>
                    <h3 className="text-sm font-semibold">Narration</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="narration"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={2}
                            placeholder="Optional description shown to the beneficiary…"
                          />
                        </FormControl>
                        <FormDescription>
                          Max 120 characters · appears on the beneficiary statement.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <Separator />

                {/* Supporting documents */}
                <section className="grid gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      5
                    </span>
                    <h3 className="text-sm font-semibold">Supporting documents *</h3>
                  </div>

                  <label
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors',
                      documents.length >= MAX_DOCS
                        ? 'opacity-50'
                        : 'hover:border-primary hover:bg-primary/5',
                      docsError && 'border-destructive/70 bg-destructive/5',
                    )}
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={documents.length >= MAX_DOCS}
                      onChange={(e) => {
                        addFiles(e.target.files)
                        e.target.value = ''
                      }}
                    />
                    <UploadCloud className="size-6 text-primary" />
                    <p className="text-sm font-medium">
                      Click to upload supporting documents
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invoice, mandate or approval letter · PDF, JPG or PNG · up to{' '}
                      {MAX_DOCS} files · max 5 MB each
                    </p>
                  </label>

                  {docsError ? (
                    <p
                      role="alert"
                      className="flex items-center gap-1.5 text-xs font-semibold text-destructive"
                    >
                      <AlertCircle className="size-3.5 shrink-0" />
                      {docsError}
                    </p>
                  ) : null}

                  {documents.length > 0 && (
                    <ul className="grid gap-2">
                      {documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                        >
                          <FileText className="size-4.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDocuments((prev) =>
                                prev.filter((d) => d.id !== doc.id),
                              )
                            }
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Remove ${doc.name}`}
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-3 xl:sticky xl:top-20">
          <Card className="bg-space-grey text-sidebar-foreground">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-[15px] text-white">
                <ArrowRight className="size-4 text-orange" />
                Transfer summary
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/60">Source account</span>
                <span className="max-w-[150px] truncate text-right font-medium text-white">
                  {sourceAccount || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/60">Source balance</span>
                <span
                  className={cn(
                    'max-w-[150px] truncate text-right font-medium',
                    balanceResolved && insufficient ? 'text-orange' : 'text-white',
                  )}
                >
                  {balanceResolved ? formatCurrency(sourceBalance ?? 0) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/60">Beneficiary</span>
                <span className="max-w-[150px] truncate text-right font-medium text-white">
                  {beneficiaryName || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Attachments</span>
                <span className="font-medium text-white">
                  {documents.length === 0
                    ? 'None'
                    : `${documents.length} file${documents.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-white/60">Amount</span>
                <span className="font-medium text-white">
                  {amount ? formatCurrency(Number(amount)) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Bank transfer fee (0.5%)</span>
                <span className="font-medium text-white">
                  {amount ? formatCurrency(fee) : '—'}
                </span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Total debit</span>
                <span className="text-xl font-bold tabular-nums text-orange">
                  {amount ? formatCurrency(total) : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            disabled={sendingOtp || lookingUp || insufficient}
            onClick={form.handleSubmit(requestSubmit)}
          >
            <ArrowRight className="size-4" />
            {sendingOtp ? 'Initiating…' : 'Review & submit transfer'}
          </Button>

          <Card className="gap-3">
            <CardContent className="gap-2 py-4">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <ShieldCheck className="size-4 text-primary" />
                Maker → Checker flow
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                As a <span className="font-medium text-foreground">Maker</span>,
                transfers above your single limit are sent to the approval queue
                for a Checker (Tier 2+) to verify and sign off. Beneficiary name
                enquiry and supporting documents help the checker decide faster.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer OTP verification */}
      <Dialog
        open={otpStep}
        onOpenChange={(o) => {
          if (!o) {
            setOtpStep(false)
            setOtpCode('')
            setTransferRequestId(null)
            setMaskedPhone('')
            setOtpError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              Verify customer via OTP
            </DialogTitle>
            <DialogDescription>
              {beneficiaryName || 'Beneficiary'} ·{' '}
              {amount ? formatCurrency(total) : 'Amount'}.{' '}
              {sourceAccount ? `Debited from ${sourceAccount}.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {maskedPhone ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">
                    Code sent to {maskedPhone}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                The verification code is being sent to the customer's phone.
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="customer-otp">Enter 6-digit OTP</Label>
              <Input
                id="customer-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="e.g. 482 901"
                className="text-center text-xl font-bold tracking-[0.5em] tabular-nums font-mono"
                value={otpCode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtpCode(digits)
                  setOtpError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && otpCode.length === 6 && transferRequestId) {
                    void confirmSubmit()
                  }
                }}
                disabled={sendingOtp || !transferRequestId}
              />
              <div className="flex items-center justify-end text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {otpCode.length}/6 digits
                </span>
              </div>
            </div>

            {otpError ? (
              <p
                role="alert"
                className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                {otpError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={
                sendingOtp ||
                insufficient ||
                otpCode.length !== 6 ||
                !transferRequestId
              }
              onClick={confirmSubmit}
            >
              <ArrowRight className="size-4" />
              {sendingOtp ? 'Verifying…' : 'Confirm & submit transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}