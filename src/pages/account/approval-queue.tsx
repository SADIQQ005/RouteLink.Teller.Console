import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  Building2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  Eye,
  Inbox,
  Layers,
  ShieldAlert,
  Sparkles,
  User,
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import {
  useApprovals,
  useResolveApproval,
} from '@/hooks/use-api'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ApprovalItem } from '@/lib/data'

type Filter = 'All' | 'High priority' | 'Tier 2' | 'Tier 3'

const FILTERS: Filter[] = ['All', 'High priority', 'Tier 2', 'Tier 3']

const PAGE_SIZE = 5

const PRIORITY_TONE: Record<ApprovalItem['priority'], string> = {
  High: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  Medium:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
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

export function ApprovalQueuePage() {
  const { data: approvals, isLoading } = useApprovals()
  const resolve = useResolveApproval()
  const [filter, setFilter] = useState<Filter>('All')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detail, setDetail] = useState<ApprovalItem | null>(null)
  const [rejectTargets, setRejectTargets] = useState<ApprovalItem[]>([])
  const [rejectReason, setRejectReason] = useState('')

  const counts = {
    total: approvals?.length ?? 0,
    tier2: approvals?.filter((a) => a.requiredTier === 2).length ?? 0,
    tier3: approvals?.filter((a) => a.requiredTier === 3).length ?? 0,
    high: approvals?.filter((a) => a.priority === 'High').length ?? 0,
    volume: approvals?.reduce((sum, a) => sum + a.amount, 0) ?? 0,
  }

  const visible = useMemo(() => {
    if (!approvals) return []
    if (filter === 'High priority')
      return approvals.filter((a) => a.priority === 'High')
    if (filter === 'Tier 2')
      return approvals.filter((a) => a.requiredTier === 2)
    if (filter === 'Tier 3')
      return approvals.filter((a) => a.requiredTier === 3)
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

  async function approveMany(items: ApprovalItem[]) {
    try {
      await Promise.all(
        items.map((item) =>
          resolve.mutateAsync({ id: item.id, decision: 'approve' }),
        ),
      )
      toast.success(
        items.length === 1
          ? 'Transaction approved'
          : `${items.length} transactions approved`,
      )
      setSelectedIds([])
    } catch {
      toast.error('One or more approvals failed — please retry')
    }
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

        <div className="relative mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              label: 'Awaiting your action',
              value: String(counts.total),
              icon: CheckCheck,
              tone: 'bg-primary/15 text-primary',
            },
            {
              label: 'Require Tier 2 sign-off',
              value: String(counts.tier2),
              icon: Layers,
              tone: 'bg-sky-100 text-sky-600',
            },
            {
              label: 'Require Tier 3 sign-off',
              value: String(counts.tier3),
              icon: ChevronsUp,
              tone: 'bg-violet-100 text-violet-600',
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
            <Button
              variant="outline"
              disabled={selectedItems.length === 0}
              onClick={() => approveMany(selectedItems)}
            >
              <CheckCheck className="size-4" />
              Approve selected
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
            {selectedIds.length === 0
              ? 'Select one or more items to approve or reject in bulk. Click the eye icon to view full request details.'
              : `${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} selected · ${formatCurrency(
                  selectedItems.reduce((s, a) => s + a.amount, 0),
                )}`}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead className="hidden lg:table-cell">Initiated by</TableHead>
                  <TableHead className="hidden xl:table-cell">Submitted</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Authority</TableHead>
                  <TableHead className="hidden md:table-cell">Priority</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isLoading && visible.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <Inbox className="mx-auto mb-2 size-8" />
                      Nothing in the queue for this filter.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  pageItems.map((a) => {
                    const checked = selectedIds.includes(a.id)
                    return (
                      <TableRow
                        key={a.id}
                        className={cn(
                          'cursor-pointer',
                          checked && 'bg-primary/5',
                        )}
                        onClick={() => setDetail(a)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(a)}
                            aria-label={`Select ${a.reference}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {a.reference}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">
                            {a.beneficiary}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.type} payment
                          </p>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {a.initiatedBy}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {a.submittedAt}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(a.amount, a.currency)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: a.requiredTier }).map(
                                (_, i) => (
                                  <span
                                    key={i}
                                    className={cn(
                                      'h-1.5 w-4 rounded-full',
                                      i < a.tier ? 'bg-primary' : 'bg-border',
                                    )}
                                  />
                                ),
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {a.tier}/{a.requiredTier}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={PRIORITY_TONE[a.priority]}
                          >
                            {a.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`View ${a.reference}`}
                              onClick={() => setDetail(a)}
                            >
                              <Eye className="size-4" />
                            </Button>
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
                              onClick={() => approveMany([a])}
                            >
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && visible.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                  onClick={() => approveMany(selectedItems)}
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
                  approveMany([detail])
                  setDetail(null)
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
          <div className="grid gap-2">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              placeholder="Provide a reason these requests were declined…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
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

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="size-3.5" />
        Fully approved items move to processing automatically.
      </div>
    </div>
  )
}