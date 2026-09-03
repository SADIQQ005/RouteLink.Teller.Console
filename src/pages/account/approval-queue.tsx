import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  Building2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Inbox,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import {
  useApprovals,
  useResolveApproval,
} from '@/hooks/use-api'
import { formatCurrency } from '@/lib/format'
import { downloadBlob } from '@/lib/download'
import { cn } from '@/lib/utils'
import type { ApprovalItem } from '@/lib/data'
import * as otpService from '@/services/otp'
import { useAppSelector } from '@/store'

type Filter = 'All' | 'High priority' | 'Medium priority' | 'Low priority'

const FILTERS: Filter[] = ['All', 'High priority', 'Medium priority', 'Low priority']

const REJECTION_PRESETS: string[] = [
  'Insufficient funds in source account',
  'Beneficiary details mismatch — name/account number',
  'Beneficiary bank details incorrect or invalid',
  'Payment narration unclear or missing',
  'Duplicate request — already processed',
  'Above signing limit — escalate to higher tier',
  'Supporting documents missing or invalid',
  'Compliance / KYC check failed on beneficiary',
  'Suspicious activity — flagged for review',
  'Request cancelled by initiator',
]

const PAGE_SIZE = 5

const PRIORITY_TONE: Record<ApprovalItem['priority'], string> = {
  High: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  Medium:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
}

const PRIORITY_DATE_ACCENT: Record<ApprovalItem['priority'], string> = {
  High: 'text-red-500',
  Medium: 'text-amber-600',
  Low: 'text-primary',
}

interface ParsedDate {
  dayName: string
  dayNum: string
  month: string
  year: string
  time: string
  monthKey: string
  sortKey: number
}

function parseSubmittedAt(input: string): ParsedDate {
  const cleaned = input.replace('·', ',').trim()
  const date = new Date(cleaned)
  if (!Number.isNaN(date.getTime())) {
    return {
      dayName: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNum: date.toLocaleDateString('en-GB', { day: '2-digit' }),
      month: date.toLocaleDateString('en-GB', { month: 'long' }),
      year: date.toLocaleDateString('en-GB', { year: 'numeric' }),
      time: date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      sortKey: date.getTime(),
    }
  }
  const match = input.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})[\s,·]+(\d{1,2}:\d{2})/,
  )
  if (match) {
    const [, dayNum, monthRaw, year, time] = match
    const monthDate = new Date(`${monthRaw} 1, ${year}`)
    const monthNum = monthDate.getMonth()
    const dayNameDate = new Date(
      Number(year),
      monthNum,
      Number(dayNum),
    )
    return {
      dayName: dayNameDate.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNum: String(dayNum).padStart(2, '0'),
      month: monthDate.toLocaleDateString('en-GB', { month: 'long' }),
      year,
      time,
      monthKey: `${year}-${String(monthNum + 1).padStart(2, '0')}`,
      sortKey: dayNameDate.getTime(),
    }
  }
  return {
    dayName: '—',
    dayNum: '00',
    month: 'Unknown',
    year: '',
    time: input,
    monthKey: '0000-00',
    sortKey: 0,
  }
}

interface CalendarGroup {
  monthKey: string
  label: string
  items: ApprovalItem[]
}

function groupByMonth(items: ApprovalItem[]): CalendarGroup[] {
  const groups = new Map<string, CalendarGroup>()
  for (const item of items) {
    const parsed = parseSubmittedAt(item.submittedAt)
    if (!groups.has(parsed.monthKey)) {
      groups.set(parsed.monthKey, {
        monthKey: parsed.monthKey,
        label: parsed.year ? `${parsed.month} ${parsed.year}` : parsed.month,
        items: [],
      })
    }
    groups.get(parsed.monthKey)!.items.push(item)
  }
  return Array.from(groups.values()).sort((a, b) =>
    b.monthKey.localeCompare(a.monthKey),
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          'max-w-[60%] text-right text-sm font-medium',
          mono && 'font-mono tabular-nums',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function downloadSupportingDocument(doc: string, item: ApprovalItem) {
  const body = [
    'RouteLink Teller Console — Supporting document',
    '=====================================================',
    `Request reference : ${item.reference}`,
    `Beneficiary       : ${item.beneficiary}`,
    `Amount            : ${formatCurrency(item.amount, item.currency)}`,
    `Initiated by      : ${item.initiatedBy}`,
    `Submitted at      : ${item.submittedAt}`,
    `Method            : ${item.method}`,
    `Document          : ${doc}`,
    '',
    'This is a demo preview generated by the teller console.',
  ].join('\n')
  downloadBlob(
    `${doc.replace(/\.[a-z0-9]+$/i, '')}-preview.txt`,
    body,
    'text/plain',
  )
  toast.success('Download started', { description: doc })
}

export function ApprovalQueuePage() {
  const { data: approvals, isLoading } = useApprovals()
  const resolve = useResolveApproval()
  const user = useAppSelector((state) => state.auth.user)
  const [filter, setFilter] = useState<Filter>('All')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detail, setDetail] = useState<ApprovalItem | null>(null)
  const [rejectTargets, setRejectTargets] = useState<ApprovalItem[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [approveTargets, setApproveTargets] = useState<ApprovalItem[]>([])
  const [otpCode, setOtpCode] = useState('')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [otpSentTo, setOtpSentTo] = useState<string>('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0)
  const [otpResendAfter, setOtpResendAfter] = useState<number>(0)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    if (approveTargets.length === 0) return
    const id = window.setInterval(() => setNowTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [approveTargets.length])

  const counts = {
    total: approvals?.length ?? 0,
    high: approvals?.filter((a) => a.priority === 'High').length ?? 0,
    volume: approvals?.reduce((sum, a) => sum + a.amount, 0) ?? 0,
  }

  const visible = useMemo(() => {
    if (!approvals) return []
    if (filter === 'High priority')
      return approvals.filter((a) => a.priority === 'High')
    if (filter === 'Medium priority')
      return approvals.filter((a) => a.priority === 'Medium')
    if (filter === 'Low priority')
      return approvals.filter((a) => a.priority === 'Low')
    return approvals
  }, [approvals, filter])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const from = visible.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const to = Math.min(currentPage * PAGE_SIZE, visible.length)
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const selectedItems =
    approvals?.filter((a) => selectedIds.includes(a.id)) ?? []

  const allVisibleSelected =
    pageItems.length > 0 && pageItems.every((a) => selectedIds.includes(a.id))

  const now = useMemo(() => Date.now(), [nowTick])
  const otpExpiresInMs = Math.max(0, otpExpiresAt - now)
  const otpExpiresInMin = Math.floor(otpExpiresInMs / 60000)
  const otpExpiresInSec = Math.floor((otpExpiresInMs % 60000) / 1000)
  const canResendOtp = otpResendAfter > 0 && now >= otpResendAfter && !sendingOtp
  const resendCountdown = Math.max(0, Math.ceil((otpResendAfter - now) / 1000))

  function selectFilter(f: Filter) {
    setFilter(f)
    setPage(1)
    setSelectedIds([])
  }

  function gotoPage(p: number) {
    setPage(p)
    setSelectedIds([])
  }

  function toggle(item: ApprovalItem) {
    setSelectedIds((prev) =>
      prev.includes(item.id)
        ? prev.filter((id) => id !== item.id)
        : [...prev, item.id],
    )
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !pageItems.some((a) => a.id === id))
        : [...new Set([...prev, ...pageItems.map((a) => a.id)])],
    )
  }

  async function sendCheckerOtp(items: ApprovalItem[]) {
    setSendingOtp(true)
    setOtpError(null)
    try {
      const resp = await otpService.sendCheckerOtp({
        checkerUserId: user.id,
        checkerEmail: user.email,
        transactionIds: items.map((i) => i.id),
        references: items.map((i) => i.reference),
      })
      setOtpId(resp.otpId)
      setOtpSentTo(resp.sentTo)
      setOtpExpiresAt(new Date(resp.expiresAt).getTime())
      setOtpResendAfter(Date.now() + resp.resendAfter)
      setOtpCode('')
      toast.success('Approval OTP sent', {
        description: `Verification code sent to ${resp.sentTo}. Enter the 6-digit code to sign off.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not send OTP'
      toast.error('Failed to send OTP', { description: message })
      setOtpError(message)
    } finally {
      setSendingOtp(false)
    }
  }

  async function approveMany(items: ApprovalItem[]) {
    if (!otpId) {
      setOtpError('OTP session missing. Please request a new code.')
      return
    }
    if (otpCode.trim().length !== 6) {
      setOtpError('Enter the 6-digit code sent to your device.')
      return
    }
    setOtpError(null)
    try {
      await Promise.all(
        items.map((item) =>
          resolve.mutateAsync({
            id: item.id,
            decision: 'approve',
            otpId: otpId,
            otpCode: otpCode.trim(),
          }),
        ),
      )
      toast.success(
        items.length === 1
          ? 'Transaction approved'
          : `${items.length} transactions approved`,
      )
      setSelectedIds([])
      setApproveTargets([])
      setOtpCode('')
      setOtpId(null)
      setOtpSentTo('')
      setOtpExpiresAt(0)
      setOtpResendAfter(0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'One or more approvals failed — please retry'
      setOtpError(message)
      toast.error('Approval failed', { description: message })
    }
  }

  function confirmApprove(items: ApprovalItem[]) {
    setOtpCode('')
    setOtpId(null)
    setOtpError(null)
    setApproveTargets(items)
    void sendCheckerOtp(items)
  }

  async function resendCheckerOtp() {
    await sendCheckerOtp(approveTargets)
  }

  async function rejectMany(items: ApprovalItem[]) {
    try {
      await Promise.all(
        items.map((item) =>
          resolve.mutateAsync({
            id: item.id,
            decision: 'reject',
            reason: rejectReason,
          }),
        ),
      )
      toast.success(
        items.length === 1
          ? 'Transaction rejected'
          : `${items.length} transactions rejected`,
      )
      setSelectedIds([])
      setRejectTargets([])
      setRejectReason('')
    } catch {
      toast.error('One or more rejections failed — please retry')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Approval Queue" />

      {/* Soft header hero — matches the pale lavender reference block */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-panel-lavender via-panel-lavender-soft to-card p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 size-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge
              variant="outline"
              className="gap-1.5 border-panel-lavender-ink/20 bg-white/60 text-panel-lavender-ink"
            >
              <Sparkles className="size-3" />
              Queue snapshot
            </Badge>
            <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
              {counts.total} payment{counts.total === 1 ? '' : 's'} awaiting authority
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Review, verify and sign off on payment requests routed to you.
              Items above your signing limit require a second authority.
            </p>
          </div>
          <div className="flex w-full items-baseline justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
            <span className="text-xs font-medium text-panel-lavender-ink/80">
              Total volume in queue
            </span>
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCurrency(counts.volume)}
            </span>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          {[
            {
              label: 'Awaiting your action',
              value: String(counts.total),
              icon: CheckCheck,
              tone: 'bg-primary/15 text-primary',
            },
            {
              label: 'High priority',
              value: String(counts.high),
              icon: ShieldAlert,
              tone: 'bg-red-100 text-red-600',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 p-3.5 backdrop-blur-sm"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  s.tone,
                )}
              >
                <s.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none tabular-nums">
                  {isLoading ? '…' : s.value}
                </p>
                <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="gap-5 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => selectFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    filter === f
                      ? 'bg-foreground text-background'
                      : 'border text-muted-foreground hover:border-primary hover:text-primary',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 my-3 text-xs font-medium text-muted-foreground">
            {selectedIds.length === 0
              ? 'Select one or more items to approve or reject in bulk. Click the eye icon to view full request details.'
              : `${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} selected · ${formatCurrency(
                  selectedItems.reduce((s, a) => s + a.amount, 0),
                )}`}
          </div>

          {/* Select-all bar for calendar view */}
          {!isLoading && pageItems.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all on this page"
                />
                <span>Select all on this page</span>
              </div>
              <div className="hidden sm:block">
                {selectedIds.length === 0
                  ? `${pageItems.length} item${pageItems.length === 1 ? '' : 's'} on this page`
                  : `${selectedIds.length} selected · ${formatCurrency(
                      selectedItems.reduce((s, a) => s + a.amount, 0),
                    )}`}
              </div>
            </div>
          )}

          {/* Calendar-style grouped list */}
          <div className="space-y-5">
            {isLoading &&
              [1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-stretch gap-4 rounded-xl border p-4"
                >
                  <Skeleton className="w-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex shrink-0 flex-col justify-between items-end gap-2">
                    <Skeleton className="h-6 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}

            {!isLoading && visible.length === 0 && (
              <div className="rounded-xl border py-14 text-center text-muted-foreground">
                <Inbox className="mx-auto mb-3 size-10 opacity-50" />
                <p className="font-medium">Nothing in the queue for this filter.</p>
                <p className="mt-1 text-xs">
                  Switch filters or initiate a new payment to see items here.
                </p>
              </div>
            )}

            {!isLoading &&
              pageItems.length > 0 &&
              groupByMonth(pageItems).map((group) => (
                <div key={group.monthKey} className="space-y-2">
                  <h3 className="px-1 text-sm font-bold tracking-tight text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.items.map((a) => {
                      const checked = selectedIds.includes(a.id)
                      const parsed = parseSubmittedAt(a.submittedAt)
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            'group flex items-stretch gap-4 rounded-xl border bg-card p-4 transition-all cursor-pointer hover:shadow-md hover:border-primary/30',
                            checked &&
                              'border-primary/40 bg-primary/[0.04] shadow-sm',
                          )}
                          onClick={() => setDetail(a)}
                        >
                          {/* Calendar date block */}
                          <div className="flex shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/40 px-3 py-2 min-w-[64px]">
                            <span
                              className={cn(
                                'text-[11px] font-bold uppercase tracking-wider',
                                PRIORITY_DATE_ACCENT[a.priority],
                              )}
                            >
                              {parsed.dayName}
                            </span>
                            <span
                              className={cn(
                                'mt-0.5 text-2xl font-extrabold leading-none tabular-nums',
                                PRIORITY_DATE_ACCENT[a.priority],
                              )}
                            >
                              {parsed.dayNum}
                            </span>
                          </div>

                          {/* Main content */}
                          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-mono text-sm font-semibold text-primary">
                                {a.reference}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  PRIORITY_TONE[a.priority],
                                  'text-[10px] uppercase tracking-wide',
                                )}
                              >
                                {a.priority}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <p className="font-semibold text-foreground leading-tight">
                                {a.beneficiary}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {a.type} payment
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3" />
                                {parsed.time}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <User className="size-3" />
                                {a.initiatedBy}
                              </span>
                              <span className="hidden sm:inline-flex items-center gap-1.5">
                                <Wallet className="size-3" />
                                {a.method}
                              </span>
                            </div>
                          </div>

                          {/* Right side: amount + actions */}
                          <div
                            className="flex shrink-0 flex-col items-end justify-between gap-2 sm:gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="text-right">
                              <p className="text-lg font-bold tabular-nums leading-tight">
                                {formatCurrency(a.amount, a.currency)}
                              </p>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                Tier {a.requiredTier} auth
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1 mr-1">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggle(a)}
                                  aria-label={`Select ${a.reference}`}
                                />
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label={`View ${a.reference}`}
                                  onClick={() => setDetail(a)}
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={resolve.isPending}
                                onClick={() => {
                                  setRejectReason('')
                                  setRejectTargets([a])
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                disabled={resolve.isPending}
                                onClick={() => confirmApprove([a])}
                              >
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination */}
          {!isLoading && visible.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-semibold text-foreground">
                  {from}–{to}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-foreground">
                  {visible.length}
                </span>{' '}
                requests
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => gotoPage(currentPage - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => gotoPage(i + 1)}
                    className={cn(
                      'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors',
                      currentPage === i + 1
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label="Next page"
                  disabled={currentPage === totalPages}
                  onClick={() => gotoPage(currentPage + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {selectedItems.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-space-grey p-3.5 text-sidebar-foreground">
              <div className="flex items-center gap-2 text-sm">
                <CheckCheck className="size-4 text-orange" />
                <span className="font-medium text-white">
                  {selectedItems.length} selected
                </span>
                <span className="text-white/50">
                  · {formatCurrency(selectedItems.reduce((s, a) => s + a.amount, 0))}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  disabled={resolve.isPending}
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/5 text-red-300 hover:bg-destructive/80 hover:text-white"
                  disabled={resolve.isPending}
                  onClick={() => {
                    setRejectReason('')
                    setRejectTargets(selectedItems)
                  }}
                >
                  Reject all
                </Button>
                <Button
                  disabled={resolve.isPending}
                  onClick={() => confirmApprove(selectedItems)}
                >
                  <CheckCheck className="size-4" />
                  Approve all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        {detail && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-mono text-base">
                  {detail.reference}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={PRIORITY_TONE[detail.priority]}
                >
                  {detail.priority} priority
                </Badge>
              </div>
              <DialogDescription>
                {detail.type} payment · submitted {detail.submittedAt} by{' '}
                {detail.initiatedBy}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{detail.beneficiary}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.beneficiaryBank}
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {formatCurrency(detail.amount, detail.currency)}
                </p>
              </div>

              <div className="grid gap-2.5">
                <DetailRow
                  label="Beneficiary account"
                  value={detail.beneficiaryAccount}
                  mono
                />
                <DetailRow
                  label="Source account"
                  value={detail.sourceAccount}
                  mono
                />
                <DetailRow label="Payment method" value={detail.method} />
                <DetailRow label="Narration" value={detail.narration} />
                <DetailRow label="Initiated by" value={detail.initiatedBy} />
                <DetailRow label="Submitted at" value={detail.submittedAt} />
                <DetailRow
                  label="Required authority"
                  value={`Tier ${detail.requiredTier} · ${detail.tier}/${detail.requiredTier} signature${detail.tier === detail.requiredTier ? 's complete' : ' pending'}`}
                />
              </div>

              <Separator />

              <div className="grid gap-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <h4 className="text-sm font-semibold">
                    Supporting documents
                  </h4>
                </div>
                {detail.documents?.length ? (
                  <ul className="grid gap-2">
                    {detail.documents.map((doc) => (
                      <li
                        key={doc}
                        className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                      >
                        <FileText className="size-4.5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 px-2.5 text-xs"
                          aria-label={`Download ${doc}`}
                          onClick={() => downloadSupportingDocument(doc, detail)}
                        >
                          <Download className="size-3.5" />
                          Download
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No supporting documents attached.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
                <User className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  The maker has already verified the beneficiary name enquiry.
                  Confirm the details above before signing off.
                </p>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={resolve.isPending}
                onClick={() => {
                  setRejectReason('')
                  setRejectTargets([detail])
                  setDetail(null)
                }}
              >
                Reject
              </Button>
              <Button
                disabled={resolve.isPending}
                onClick={() => {
                  setDetail(null)
                  confirmApprove([detail])
                }}
              >
                <CheckCheck className="size-4" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Rejection reason */}
      <Dialog
        open={rejectTargets.length > 0}
        onOpenChange={(o) => {
          if (!o) setRejectTargets([])
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-4 text-destructive" />
              Reject{' '}
              {rejectTargets.length === 1
                ? rejectTargets[0]?.reference
                : `${rejectTargets.length} transactions`}
            </DialogTitle>
            <DialogDescription>
              {rejectTargets.length === 1 ? (
                <>
                  {rejectTargets[0]?.beneficiary} ·{' '}
                  {rejectTargets[0]
                    ? formatCurrency(
                        rejectTargets[0].amount,
                        rejectTargets[0].currency,
                      )
                    : ''}
                </>
              ) : (
                <>
                  {rejectTargets.length} transactions totalling{' '}
                  {formatCurrency(
                    rejectTargets.reduce((s, a) => s + a.amount, 0),
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quick reasons
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset) => {
                  const selected = rejectReason.trim() === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setRejectReason(selected ? '' : preset)
                      }
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        selected
                          ? 'border-destructive/40 bg-destructive/10 text-destructive'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive',
                      )}
                    >
                      {preset}
                    </button>
                  )
                })}
              </div>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="reject-reason">Reason for rejection</Label>
              <Textarea
                id="reject-reason"
                rows={3}
                placeholder="Pick a quick reason above or type your own…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Minimum 5 characters. Rejection is recorded on the audit trail.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={resolve.isPending || rejectReason.trim().length < 5}
              onClick={() => rejectMany(rejectTargets)}
            >
              Reject transaction{rejectTargets.length === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checker OTP verification */}
      <Dialog
        open={approveTargets.length > 0}
        onOpenChange={(o) => {
          if (!o) {
            setApproveTargets([])
            setOtpCode('')
            setOtpId(null)
            setOtpError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              Verify your identity with OTP
            </DialogTitle>
            <DialogDescription>
              {approveTargets.length === 1 ? (
                <>
                  Approve {approveTargets[0]?.reference} ·{' '}
                  {approveTargets[0]
                    ? formatCurrency(
                        approveTargets[0].amount,
                        approveTargets[0].currency,
                      )
                    : ''}
                </>
              ) : (
                <>
                  {approveTargets.length} transactions totalling{' '}
                  {formatCurrency(
                    approveTargets.reduce((s, a) => s + a.amount, 0),
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {sendingOtp ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" />
                Sending verification code to your registered device…
              </div>
            ) : otpSentTo ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">
                    Code sent to {otpSentTo}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  <Clock className="size-3.5" />
                  {otpExpiresInMin}:{String(otpExpiresInSec).padStart(2, '0')}
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="checker-otp">Enter 6-digit OTP</Label>
              <Input
                id="checker-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="e.g. 374 920"
                className="text-center text-xl font-bold tracking-[0.5em] tabular-nums font-mono"
                value={otpCode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtpCode(digits)
                  setOtpError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && otpCode.length === 6 && otpId) {
                    void approveMany(approveTargets)
                  }
                }}
                disabled={sendingOtp || !otpId}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  disabled={!canResendOtp || sendingOtp}
                  onClick={resendCheckerOtp}
                  className={cn(
                    'inline-flex items-center gap-1 font-medium transition-colors',
                    canResendOtp && !sendingOtp
                      ? 'text-primary hover:underline'
                      : 'cursor-not-allowed text-muted-foreground/60',
                  )}
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5',
                      sendingOtp && 'animate-spin',
                    )}
                  />
                  {sendingOtp
                    ? 'Sending…'
                    : canResendOtp
                      ? 'Resend code'
                      : `Resend available in ${resendCountdown}s`}
                </button>
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
                resolve.isPending ||
                sendingOtp ||
                otpCode.length !== 6 ||
                !otpId
              }
              onClick={() => approveMany(approveTargets)}
            >
              <CheckCheck className="size-4" />
              {resolve.isPending
                ? 'Approving…'
                : `Approve${approveTargets.length > 1 ? ` ${approveTargets.length}` : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="size-3.5" />
        Fully approved items move to processing automatically.
      </div>
    </div>
  )
}