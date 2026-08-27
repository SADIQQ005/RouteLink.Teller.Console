import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Menu,
  Search,
  TriangleAlert,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppDispatch } from '@/store'
import { toggleSidebar } from '@/store/slices/ui-slice'

const BREADCRUMBS: Record<string, { crumbs: string[]; title: string }> = {
  '/': { crumbs: ['Dashboard'], title: 'Dashboard' },
  '/payments/new': {
    crumbs: ['Payments', 'New Transaction'],
    title: 'New Transaction',
  },
  '/payments/transactions': {
    crumbs: ['Payments', 'Transactions'],
    title: 'Transactions',
  },
  '/account/approval-queue': {
    crumbs: ['Account', 'Approval Queue'],
    title: 'Approval Queue',
  },
  '/account/reconciliation': {
    crumbs: ['Account', 'Reconciliation'],
    title: 'Reconciliation',
  },
  '/account/audit-trail': {
    crumbs: ['Account', 'Audit Trail'],
    title: 'Audit Trail',
  },
  '/administration/users': {
    crumbs: ['Administration', 'Users'],
    title: 'Users',
  },
  '/administration/transaction-limits': {
    crumbs: ['Administration', 'Transaction Limits'],
    title: 'Transaction Limits',
  },
  '/administration/approval-roles': {
    crumbs: ['Administration', 'Approval Roles'],
    title: 'Approval Roles',
  },
  '/profile': { crumbs: ['Profile'], title: 'Profile' },
}

const NOTIFICATIONS = [
  {
    icon: CheckCheck,
    tone: 'text-emerald-600 bg-emerald-100',
    title: 'Approval — TRX-260827-0139 approved',
    time: '8 min ago',
  },
  {
    icon: TriangleAlert,
    tone: 'text-amber-600 bg-amber-100',
    title: 'Reconciliation batch REC-0826-002 has a discrepancy',
    time: '2 hr ago',
  },
  {
    icon: Bell,
    tone: 'text-sky-600 bg-sky-100',
    title: 'New approval request awaiting your review',
    time: '5 hr ago',
  },
] as const

function PageBreadcrumb({ pathname }: { pathname: string }) {
  const meta = BREADCRUMBS[pathname] ?? { crumbs: [pathname], title: '' }

  return (
    <div className="min-w-0">
      <p className="hidden text-[12px] font-medium text-muted-foreground sm:flex items-center">
        <span className="text-muted-foreground/60">RouteLink</span>
        <span className="mx-1.5 text-muted-foreground/40">/</span>
        {meta.crumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center">
            {i > 0 && (
              <ChevronRight className="mx-1 size-3 text-muted-foreground/40" />
            )}
            <span
              className={
                i === meta.crumbs.length - 1
                  ? 'text-muted-foreground font-semibold'
                  : 'opacity-70'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </p>
      <h1 className="truncate text-[15.5px] font-semibold tracking-tight">
        {meta.title || 'RouteLink'}
      </h1>
    </div>
  )
}

export function SiteHeader({ pathname }: { pathname: string }) {
  const dispatch = useAppDispatch()

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border/50 glass-dark px-4 sm:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <PageBreadcrumb pathname={pathname} />

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search transactions, users…"
            className="h-10 w-60 pl-10 bg-background/60 backdrop-blur-sm border-border/60"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          aria-label="Search"
        >
          <Search className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative shrink-0"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary ring-2 ring-background shadow-[0_0_0_1px_rgba(249,115,22,0.4)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[360px] rounded-xl p-1.5 shadow-xl">
            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[14px] font-semibold tracking-tight">Notifications</span>
              <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-[11.5px] font-bold text-primary">
                {NOTIFICATIONS.length} new
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-1.5" />
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
              {NOTIFICATIONS.map((n, idx) => (
                <DropdownMenuItem
                  key={idx}
                  className="items-start gap-3 rounded-xl p-3 focus:bg-accent/60"
                >
                  <span
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${n.tone}`}
                  >
                    <n.icon className="size-4.5" />
                  </span>
                  <span className="min-w-0 py-0.5">
                    <span className="block text-[13px] leading-snug font-semibold text-foreground">
                      {n.title}
                    </span>
                    <span className="block pt-1 text-[11.5px] text-muted-foreground">
                      {n.time}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="mx-1.5" />
            <DropdownMenuItem asChild className="justify-center text-primary rounded-xl mx-1 my-1 py-2.5 font-semibold text-[13px]">
              <Link to="/account/approval-queue" className="text-center">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { BREADCRUMBS }
