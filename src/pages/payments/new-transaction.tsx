import { useState } from 'react'
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
import { useCreateTransaction } from '@/hooks/use-api'
import { formatCurrency } from '@/lib/format'
import { useAppSelector } from '@/store'

const banks = [
  'Access Bank Plc',
  'Zenith Bank Plc',
  'Guaranty Trust Bank',
  'First Bank of Nigeria',
  'Union Bank Plc',
  'Sterling Bank Plc',
  'Wema Bank Plc',
  'Kuda Microfinance Bank',
]

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
  amount: z.coerce
    .number({ invalid_type_error: 'Enter the transfer amount' })
    .positive('Amount must be greater than zero'),
  narration: z.string().max(120, 'Keep narration under 120 characters').optional(),
})

type FormValues = z.infer<typeof schema>

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
  const user = useAppSelector((state) => state.auth.user)
  const createTx = useCreateTransaction()

  const [enquiring, setEnquiring] = useState(false)
  const [enquiryName, setEnquiryName] = useState<string | null>(null)
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [docsError, setDocsError] = useState<string | null>(null)
  const [amountDisplay, setAmountDisplay] = useState('')

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

  function onSubmit(values: FormValues) {
    if (documents.length === 0) {
      setDocsError('Upload at least one supporting document')
      toast.error('Supporting document required', {
        description:
          'Add an invoice, mandate or approval letter before submitting.',
      })
      return
    }
    createTx.mutate(
      {
        beneficiary: values.beneficiaryName,
        description: values.narration || 'Bank transfer',
        account: values.sourceAccount,
        amount: values.amount,
        currency: 'NGN',
        type: 'Debit',
        method: 'Bank Transfer',
        initiatedBy: `${user.firstName} ${user.lastName}`,
        documents: documents.map((d) => d.name),
        beneficiaryAccount: values.accountNumber,
        beneficiaryBank: values.bank,
      },
      {
        onSuccess: (tx) => {
          toast.success('Transfer submitted', {
            description: `Reference ${tx.reference} was created and routed for ${
              tx.status === 'Pending' ? 'approval' : 'processing'
            }.`,
          })
          form.reset(defaultValues)
          form.resetField('amount', {
            defaultValue: '' as unknown as number,
          })
          setAmountDisplay('')
          setDocuments([])
          setDocsError(null)
          setEnquiryName(null)
        },
        onError: () => {
          toast.error('Submission failed', {
            description: 'Please review the form and try again.',
          })
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Transaction"
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
                onSubmit={form.handleSubmit(onSubmit)}
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select bank" />
                              </SelectTrigger>
                              <SelectContent>
                                {banks.map((bank) => (
                                  <SelectItem key={bank} value={bank}>
                                    {bank}
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
                </section>

                <Separator />

                {/* Narration */}
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
            disabled={createTx.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            <ArrowRight className="size-4" />
            {createTx.isPending ? 'Submitting…' : 'Review & submit transfer'}
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
    </div>
  )
}