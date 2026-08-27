import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSearch,
  Inbox,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { useTransactions } from '@/hooks/use-api'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TransactionStatus } from '@/lib/data'

const STATUS_FILTERS: Array<'All' | TransactionStatus> = [
  'All',
  'Pending',
  'Success',
  'Failed',
]

const STATUS_TONE: Record<TransactionStatus, string> = {
  Success:
    'bg-gradient-to-b from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200/70',
  Pending:
    'bg-gradient-to-b from-amber-100 to-amber-50 text-amber-700 border border-amber-200/70',
  Failed:
    'bg-gradient-to-b from-rose-100 to-rose-50 text-rose-700 border border-rose-200/70',
}

export function TransactionsPage() {
  const { data: transactions, isLoading, isFetching, refetch } = useTransactions()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'All' | TransactionStatus>('All')

  const filtered = useMemo(() => {
    if (!transactions) return []
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      const matchesStatus = status === 'All' || t.status === status
      const matchesQuery =
        !q ||
        t.reference.toLowerCase().includes(q) ||
        t.beneficiary.toLowerCase().includes(q) ||
        t.initiatedBy.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [transactions, query, status])

  const counts = useMemo(() => {
    const base: Record<'All' | TransactionStatus, number> = {
      All: transactions?.length ?? 0,
      Pending: 0,
      Success: 0,
      Failed: 0,
    }
    transactions?.forEach((t) => {
      base[t.status] += 1
    })
    return base
  }, [transactions])

  return (
    <div className="animate-fade-in-up grid gap-6">
      <PageHeader
        title="Transactions"
        description="View and trace every transaction initiated across the branch."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn('size-4', isFetching && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link to="/payments/new">
              <Plus className="size-4" />
              New payment
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Card className="gap-0 overflow-hidden">
        <CardHeader className="px-6 pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-[15.5px]">
                Transaction history
              </CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search reference, beneficiary…"
                  className="h-9 pl-9 text-[13px]"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border my-3 px-3 text-[12.5px] font-semibold transition-colors',
                    status === s
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground',
                  )}
                >
                  {s}
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10.5px] font-bold',
                      status === s
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {counts[s]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton
                            className={cn(
                              'h-4',
                              j === 5 ? 'w-16' : 'w-20',
                            )}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {!isLoading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <div className="flex size-12 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
                        {query || status !== 'All' ? (
                          <FileSearch className="size-5" />
                        ) : (
                          <Inbox className="size-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {query || status !== 'All'
                            ? 'No matching transactions'
                            : 'No transactions yet'}
                        </p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {query || status !== 'All'
                            ? 'Try adjusting your search or filters.'
                            : 'Initiate your first transfer to get started.'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading
                ? filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-[12.5px] font-medium">
                        {t.reference}
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.beneficiary}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {t.description}
                      </TableCell>
                      <TableCell className="font-mono text-[12.5px]">
                        {t.account}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold tabular-nums',
                          t.type === 'Credit'
                            ? 'text-emerald-600'
                            : 'text-foreground',
                        )}
                      >
                        {t.type === 'Credit' ? '+' : '−'}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-6 border px-2 py-0.5 text-[11px] font-semibold',
                            STATUS_TONE[t.status],
                          )}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}