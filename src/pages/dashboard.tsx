import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckCheck,
  ChevronRight,
  Download,
  FileText,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { useApprovals, useDashboardStats, useTransactions } from '@/hooks/use-api'
import type { DashboardStats, Transaction } from '@/lib/data'
import { downloadCsv } from '@/lib/download'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store'

const HIGH_PRIORITY_AMOUNT = 1_000_000

function buildVolumeData(transactions?: Transaction[]) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateKey: d.toLocaleDateString('en-GB'),
      count: 0,
    }
  })
  let total = 0
  transactions?.forEach((t) => {
    const txDate = new Date(t.date)
    if (!Number.isNaN(txDate.getTime())) {
      const key = txDate.toLocaleDateString('en-GB')
      const day = days.find((d) => d.dateKey === key)
      if (day) {
        day.count += 1
        total += 1
      }
    }
  })
  return { days, total }
}

const PRIORITY_TONE = {
  High: 'bg-gradient-to-b from-red-100 to-red-50 text-red-700 border border-red-200/70',
  Medium:
    'bg-gradient-to-b from-amber-100 to-amber-50 text-amber-700 border border-amber-200/70',
  Low: 'bg-gradient-to-b from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200/70',
}

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
]
function avatarColorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function exportReport({
  stats,
  transactions,
}: {
  stats?: DashboardStats
  transactions?: Transaction[]
}) {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const rows = [
    {
      'Available balance (NGN)': stats?.balance ?? '',
      'Inflow today (NGN)': stats?.inflowToday ?? '',
      'Outflow today (NGN)': stats?.outflowToday ?? '',
      'Pending approvals': stats?.pendingApprovals ?? '',
      'Inflow delta %': stats?.inflowDelta ?? '',
      'Outflow delta %': stats?.outflowDelta ?? '',
      'Approval delta': stats?.approvalDelta ?? '',
      'Generated at': new Date().toLocaleString('en-GB'),
    },
  ]
  downloadCsv(`routelink-report-${stamp}.csv`, [
    ...rows,
    ...(transactions ?? []).map((t) => ({
      section: 'Recent transaction',
      reference: t.reference,
      beneficiary: t.beneficiary,
      description: t.description,
      method: t.method,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      initiated_by: t.initiatedBy,
      date: t.date,
    })),
  ])
  toast.success('Report exported', {
    description: 'CSV report downloaded to your device.',
  })
}

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: recent } = useTransactions()
  const { data: approvals } = useApprovals()
  const user = useAppSelector((state) => state.auth.user)

  const { days: volume, total: volumeTotal } = useMemo(
    () => buildVolumeData(recent),
    [recent],
  )

  const todayKey = new Date().toLocaleDateString('en-GB')

  const { dayVolume, pendingCount, highPriorityCount } = useMemo(() => {
    const todayTx =
      recent?.filter((t) => {
        const d = new Date(t.date)
        return !Number.isNaN(d.getTime()) && d.toLocaleDateString('en-GB') === todayKey
      }) ?? []
    const dayVolume = todayTx.reduce((sum, t) => sum + t.amount, 0)
    const pendingCount =
      recent?.filter((t) => t.status === 'Pending').length ?? 0
    const highPriorityCount =
      recent?.filter((t) => t.amount >= HIGH_PRIORITY_AMOUNT).length ?? 0
    return { dayVolume, pendingCount, highPriorityCount }
  }, [recent, todayKey])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user.firstName} 👋`}
        description={`${today} — Here's what's happening across your teller console today.`}
      >
        <Button
          variant="outline"
          onClick={() => exportReport({ stats, transactions: recent })}
        >
          <Download className="size-4" />
          Export report
        </Button>
        <Button asChild>
          <Link to="/payments/new">
            <Plus className="size-4" />
            New Transfer
          </Link>
        </Button>
      </PageHeader>

      {/* Transaction snapshot hero */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-panel-lavender via-panel-lavender-soft to-card p-6 sm:p-7 animate-fade-in-up">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 size-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge
              variant="outline"
              className="gap-1.5 border-panel-lavender-ink/20 bg-white/60 text-panel-lavender-ink"
            >
              <Sparkles className="size-3" />
              Transaction snapshot
            </Badge>
            <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
              {pendingCount} transaction{pendingCount === 1 ? '' : 's'} awaiting action
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Transactions routed for review and sign off before they move to
              processing.
            </p>
          </div>
          <div className="flex w-full items-baseline justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
            <span className="text-xs font-medium text-panel-lavender-ink/80">
              Total volume today
            </span>
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCurrency(dayVolume)}
            </span>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          {[
            {
              label: 'Awaiting your action',
              value: String(pendingCount),
              icon: CheckCheck,
              tone: 'bg-primary/15 text-primary',
            },
            {
              label: 'High priority',
              value: String(highPriorityCount),
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2 gap-0 overflow-hidden animate-fade-in-up">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-[16px]">Transaction Volume</CardTitle>
              <CardDescription className="pt-1">
                {volumeTotal} transaction{volumeTotal === 1 ? '' : 's'} · last 7 days
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="h-7 gap-1.5 border-primary/20 bg-primary/10 px-3 text-[11.5px] font-bold text-primary"
              >
                <span className="size-2 rounded-full bg-primary" /> Volume
              </Badge>
              <Button variant="ghost" size="icon-sm">
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volume} margin={{ top: 12, right: 12, left: -24, bottom: 4 }}>
                  <defs>
                    <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.68 0.18 50)" stopOpacity={0.32} />
                      <stop offset="60%" stopColor="oklch(0.68 0.18 50)" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="oklch(0.68 0.18 50)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11.5, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ stroke: 'var(--border)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    contentStyle={{
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                      boxShadow: 'var(--tw-shadow-lg)',
                      fontSize: 13,
                      padding: '10px 14px',
                      fontWeight: 600,
                    }}
                    formatter={(value) => {
                      const n = typeof value === 'number' ? value : Number(value) || 0
                      return [`${n} transaction${n === 1 ? '' : 's'}`, ''] as const
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="oklch(0.68 0.18 50)"
                    strokeWidth={2.5}
                    fill="url(#volume)"
                    dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: 'oklch(0.68 0.18 50)' }}
                    activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: 'oklch(0.68 0.18 50)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden animate-fade-in-up">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-[16px] flex items-center gap-2">
                <Zap className="size-4.5 text-primary" />
                Approval Queue
              </CardTitle>
              <CardDescription className="pt-0.5">
                Requests awaiting your review
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/account/approval-queue">
                View all <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="gap-0 pt-0">
            {approvals?.slice(0, 4).map((a, idx) => (
              <div
                key={a.id}
                className="group flex items-center justify-between gap-3 py-3.5 animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <Avatar
                    className={cn(
                      'size-10 border-2 border-white shadow-[0_1px_0_rgba(255,255,255,1),0_2px_6px_-2px_rgba(15,23,42,0.15)]',
                      avatarColorFor(a.beneficiary),
                    )}
                  >
                    <AvatarFallback className={cn('bg-transparent text-[12px] font-bold', avatarColorFor(a.beneficiary))}>
                      {getInitials(a.beneficiary)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold tracking-tight">
                      {a.beneficiary}
                    </p>
                    <p className="truncate text-[11.5px] font-medium text-muted-foreground">
                      <span className="font-mono">{a.reference}</span> · {a.type}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[13.5px] font-bold tabular-nums tracking-tight">
                    {formatCurrency(a.amount, a.currency)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(PRIORITY_TONE[a.priority], 'px-2 py-0 text-[10.5px] font-bold')}
                  >
                    {a.priority}
                  </Badge>
                </div>
              </div>
            ))}
            {!approvals && (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            )}
            {approvals && approvals.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                All caught up! 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden animate-fade-in-up">
        <CardHeader className="flex-row items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-[16px] flex items-center gap-2">
              <FileText className="size-4.5 text-violet-600" />
              Recent Transactions
            </CardTitle>
            <CardDescription className="pt-0.5">
              Latest activity across all your branches
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/payments/transactions">
                View all <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-[12px] font-semibold tracking-wide text-muted-foreground/80 uppercase">
                  <th className="px-6 py-3.5 font-semibold">Reference</th>
                  <th className="px-6 py-3.5 font-semibold">Beneficiary</th>
                  <th className="hidden px-6 py-3.5 font-semibold md:table-cell">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold">Amount</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent?.slice(0, 6).map((t, idx) => (
                  <tr
                    key={t.id}
                    className="border-b border-border/50 text-[13.5px] last:border-b-0 hover:bg-accent/40 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="px-6 py-4 font-mono font-semibold tracking-tight text-foreground">
                      {t.reference}
                    </td>
                    <td className="px-6 py-4 font-medium">{t.beneficiary}</td>
                    <td className="hidden px-6 py-4 text-muted-foreground md:table-cell">
                      {t.date}
                    </td>
                    <td className="px-6 py-4 text-right font-bold tabular-nums tracking-tight">
                      <span className={t.type === 'Credit' ? 'text-emerald-600' : 'text-foreground'}>
                        {t.type === 'Credit' ? '+' : '−'}
                        {formatCurrency(t.amount, t.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          'px-2.5 py-0.5 text-[11.5px] font-bold border',
                          t.status === 'Success'
                            ? 'bg-gradient-to-b from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200/70'
                            : t.status === 'Pending'
                              ? 'bg-gradient-to-b from-amber-100 to-amber-50 text-amber-700 border-amber-200/70'
                              : 'bg-gradient-to-b from-red-100 to-red-50 text-red-700 border-red-200/70',
                        )}
                      >
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recent && (
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
