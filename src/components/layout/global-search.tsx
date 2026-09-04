import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCheck,
  CornerDownLeft,
  FileText,
  Search,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApprovals, useTransactions, useUsers } from '@/hooks/use-api'
import type { ApprovalItem, Transaction, UserRecord } from '@/lib/data'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type Group = 'Transactions' | 'Approvals' | 'Users'

interface SearchResult {
  group: Group
  title: string
  subtitle?: string
  to: string
}

function matchesTransaction(t: Transaction, q: string) {
  return [t.reference, t.beneficiary, t.description, t.initiatedBy].some((v) =>
    v.toLowerCase().includes(q),
  )
}

function matchesApproval(a: ApprovalItem, q: string) {
  return [a.reference, a.beneficiary, a.narration, a.initiatedBy].some((v) =>
    v.toLowerCase().includes(q),
  )
}

function matchesUser(u: UserRecord, q: string) {
  return [u.name, u.email, u.role, u.branch].some((v) =>
    v.toLowerCase().includes(q),
  )
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const { data: transactions } = useTransactions()
  const { data: approvals } = useApprovals()
  const { data: users } = useUsers()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()

  const results = useMemo<SearchResult[]>(() => {
    if (!q) return []
    const txnResults: SearchResult[] = (transactions ?? [])
      .filter((t) => matchesTransaction(t, q))
      .slice(0, 6)
      .map((t) => ({
        group: 'Transactions' as const,
        title: t.reference,
        subtitle: `${t.beneficiary} · ${formatCurrency(t.amount, t.currency)} · ${t.status}`,
        to: '/payments/transactions',
      }))

    const approvalResults: SearchResult[] = (approvals?.items ?? [])
      .filter((a) => matchesApproval(a, q))
      .slice(0, 6)
      .map((a) => ({
        group: 'Approvals' as const,
        title: a.reference,
        subtitle: `${a.beneficiary} · ${formatCurrency(a.amount, a.currency)} · ${a.priority} priority`,
        to: '/account/approval-queue',
      }))

    const userResults: SearchResult[] = (users ?? [])
      .filter((u) => matchesUser(u, q))
      .slice(0, 4)
      .map((u) => ({
        group: 'Users' as const,
        title: u.name,
        subtitle: `${u.role} · ${u.branch} · ${u.status}`,
        to: '/administration/users',
      }))

    return [...txnResults, ...approvalResults, ...userResults]
  }, [q, transactions, approvals, users])

  const grouped = useMemo(() => {
    const byGroup: Partial<Record<Group, SearchResult[]>> = {}
    for (const r of results) byGroup[r.group] = [...(byGroup[r.group] ?? []), r]
    return byGroup
  }, [results])

  const groupMeta: Record<Group, { icon: typeof FileText; tone: string }> = {
    Transactions: { icon: FileText, tone: 'bg-primary/10 text-primary' },
    Approvals: { icon: CheckCheck, tone: 'bg-sky-100 text-sky-600' },
    Users: { icon: User, tone: 'bg-violet-100 text-violet-600' },
  }

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function go(to: string) {
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  const first = results[0]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative hidden h-10 w-60 items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 text-left backdrop-blur-sm transition-colors hover:border-primary/40 md:flex"
        aria-label="Search transactions, users…"
      >
        <Search className="size-4 shrink-0 text-muted-foreground/60" />
        <span className="truncate text-[13px] text-muted-foreground/70">
          Search transactions, users…
        </span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground lg:inline">
          Ctrl K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
        <DialogContent
          showCloseButton
          className="gap-0 p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-3 border-b px-4 py-3.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && first) {
                  e.preventDefault()
                  go(first.to)
                }
              }}
              placeholder="Search transactions, approvals, users…"
              className="h-8 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin p-2">
            {q && results.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold">No results found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nothing matched “{query.trim()}”. Try another term.
                </p>
              </div>
            ) : null}

            {!q ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Search className="size-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">Search the console</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Jump to transactions, approvals or users by reference, name or
                  beneficiary.
                </p>
              </div>
            ) : null}

            {q && results.length > 0 ? (
              (Object.keys(grouped) as Group[]).map((group) => {
                const meta = groupMeta[group]
                const items = grouped[group] ?? []
                return (
                  <div key={group} className="grid gap-0.5">
                    <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-bold tracking-[0.08em] text-muted-foreground/70 uppercase">
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-md',
                          meta.tone,
                        )}
                      >
                        <meta.icon className="size-3" />
                      </span>
                      {group}
                    </p>
                    {items.map((item) => (
                      <button
                        key={`${group}-${item.title}`}
                        type="button"
                        onClick={() => go(item.to)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/60 focus:bg-accent/60 focus:outline-none"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground/40" />
                      </button>
                    ))}
                  </div>
                )
              })
            ) : null}
          </div>

          <div className="flex items-center gap-4 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="size-3" /> Enter to jump
            </span>
            <span className="hidden sm:inline">Ctrl K to toggle</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}