import { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Settings,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { navGroups, type NavItem, type NavSubItem } from '@/components/layout/nav-config'
import { useApprovals, useTransactions } from '@/hooks/use-api'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/slices/auth-slice'

const BADGE_COLORS: Record<string, string> = {
  orange: 'bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_4px_10px_-3px_rgba(249,115,22,0.45)]',
  green: 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_4px_10px_-3px_rgba(16,185,129,0.4)]',
}

function getBadgeStyle(badge: number) {
  if (badge >= 8) return BADGE_COLORS.green
  return BADGE_COLORS.orange
}

function SidebarBrand() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-6 pt-7 pb-2">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary via-orange-500 to-orange-deep shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_8px_24px_-8px_rgba(249,115,22,0.55)]">
        <CircleDollarSign className="size-5.5 text-white drop-shadow-sm" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[15.5px] font-bold tracking-tight text-foreground">
          RouteLink
        </p>
        <p className="text-[11.5px] font-semibold tracking-[0.04em] text-muted-foreground/70">
          TELLER · v1.0
        </p>
      </div>
    </div>
  )
}

function NavItemRow({
  item,
  expanded,
  onToggle,
}: {
  item: NavItem
  expanded: boolean
  onToggle: () => void
}) {
  const { pathname } = useLocation()
  const Icon = item.icon
  const hasChildren = !!item.children?.length
  const activeItem =
    item.path &&
    (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path))

  const childActive =
    !activeItem &&
    hasChildren &&
    item.children!.some(
      (c) =>
        c.path === '/' ? pathname === '/' : pathname.startsWith(c.path),
    )

  if (!hasChildren) {
    return (
      <NavLink
        to={item.path!}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3.5 rounded-[14px] px-3.5 py-2.75 text-[14.5px] font-semibold transition-all duration-200 ease-out',
            isActive
              ? 'bg-gradient-to-b from-white to-white/90 text-foreground shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_1px_2px_-1px_rgba(15,23,42,0.05),0_10px_30px_-14px_rgba(15,23,42,0.15)] ring-1 ring-black/[0.028]'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/60 hover:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.03)]',
          )
        }
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-[10px] transition-all duration-200',
            activeItem
              ? 'bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
              : 'bg-white/50 text-muted-foreground group-hover:bg-white group-hover:text-foreground/80',
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="truncate">{item.title}</span>
      </NavLink>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'group relative flex w-full items-center gap-3.5 rounded-[14px] px-3.5 py-2.75 text-[14.5px] font-semibold transition-all duration-200 ease-out',
          childActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/60',
        )}
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-[10px] transition-all duration-200',
            childActive
              ? 'bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
              : 'bg-white/50 text-muted-foreground group-hover:bg-white group-hover:text-foreground/80',
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="truncate">{item.title}</span>
        <span
          className={cn(
            'ml-auto flex size-6 items-center justify-center rounded-full transition-all duration-200',
            'bg-white/60 text-muted-foreground/60 group-hover:bg-white group-hover:text-muted-foreground',
          )}
        >
          {expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </span>
      </button>
    </div>
  )
}

function SidebarNav() {
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.auth.user)
  const { data: approvals } = useApprovals()
  const { data: transactions } = useTransactions()

  const pendingApprovals = approvals?.length ?? 0
  const pendingTransactions =
    transactions?.filter((t) => t.status === 'Pending').length ?? 0

  const nav = useMemo(() => {
    const isMaker = user.access === 'Maker'

    function isChildVisible(child: NavSubItem): boolean {
      if (isMaker && child.path === '/account/approval-queue') return false
      return true
    }

    const filteredGroups: typeof navGroups = []
    for (const group of navGroups) {
      if (isMaker && group.label === '' && group.items.some((i) => i.title === 'Administration')) {
        continue
      }
      const processedGroup: typeof group = {
        ...group,
        items: group.items
          .map((item) => {
            if (!item.children) return item
            const visibleChildren = item.children.filter(isChildVisible)
            if (visibleChildren.length === 0) return null
            return {
              ...item,
              children: visibleChildren.map((child) => ({
                ...child,
                badge:
                  child.path === '/account/approval-queue'
                    ? pendingApprovals
                    : child.path === '/payments/transactions'
                      ? pendingTransactions
                      : child.badge,
              })),
            }
          })
          .filter((x): x is NonNullable<typeof x> => x !== null),
      }
      if (processedGroup.items.length === 0) continue
      filteredGroups.push(processedGroup)
    }
    return filteredGroups
  }, [user.access, pendingApprovals, pendingTransactions])

  const initialExpanded = useMemo(() => {
    const s = new Set<string>(['Payments'])
    navGroups.flatMap((g) => g.items).forEach((item) => {
      if (
        item.children?.some(
          (c) =>
            c.path === '/'
              ? pathname === '/'
              : pathname.startsWith(c.path),
        )
      ) {
        s.add(item.title)
      }
    })
    return s
  }, [pathname])

  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded)

  function toggle(title: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  return (
    <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3.5 py-4">
      {nav.map((group) => (
        <div key={group.label} className="space-y-1">
          {group.label && (
            <p className="px-4 pb-1.5 pt-4 text-[10.5px] font-bold tracking-[0.18em] text-muted-foreground/55 uppercase">
              {group.label}
            </p>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const isExpanded = expanded.has(item.title)
              return (
                <li key={item.title}>
                  <NavItemRow
                    item={item}
                    expanded={isExpanded}
                    onToggle={() => toggle(item.title)}
                  />
                  {item.children && (
                    <div
                      className={cn(
                        'grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden',
                        isExpanded
                          ? 'grid-rows-[1fr] opacity-100 mt-1.5'
                          : 'grid-rows-[0fr] opacity-0 mt-0',
                      )}
                    >
                      <div className="min-h-0">
                        <ul className="relative ml-2.5 space-y-0.5 pl-7">
                          <span className="absolute left-[18px] top-0 bottom-1.5 w-px bg-gradient-to-b from-slate-300/70 via-slate-200/60 to-transparent rounded-full" />
                          {item.children.map((child) => {
                            const childActive =
                              child.path === '/'
                                ? pathname === '/'
                                : pathname.startsWith(child.path)
                            return (
                              <li key={child.path}>
                                <NavLink
                                  to={child.path}
                                  className={({ isActive }) =>
                                    cn(
                                      'group relative flex items-center gap-2 rounded-[11px] px-3 py-2.25 text-[13.5px] font-medium transition-all duration-200 ease-out',
                                      isActive
                                        ? 'bg-gradient-to-b from-white to-white/90 text-foreground shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-8px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.02]'
                                        : 'text-muted-foreground/85 hover:text-foreground hover:bg-white/45',
                                    )
                                  }
                                >
                                  <span
                                    className={cn(
                                      'absolute -left-[17px] top-1/2 h-px w-[14px] transition-all duration-200',
                                      'bg-gradient-to-r from-slate-300/70 to-slate-200/40',
                                      childActive && 'opacity-0',
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      'size-1.5 shrink-0 rounded-full transition-all duration-200',
                                      childActive
                                        ? 'bg-primary scale-125 shadow-[0_0_0_3px_rgba(249,115,22,0.12)]'
                                        : 'bg-muted-foreground/30 group-hover:bg-primary/50',
                                    )}
                                  />
                                  <span className="truncate">{child.title}</span>
                                  {child.badge ? (
                                    <span
                                      className={cn(
                                        'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tracking-tight',
                                        getBadgeStyle(child.badge),
                                      )}
                                    >
                                      {child.badge}
                                    </span>
                                  ) : null}
                                </NavLink>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarUser() {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`

  return (
    <div className="shrink-0 px-3.5 pb-5 pt-3">
      <div className="relative rounded-[14px] p-2.5 bg-gradient-to-b from-white/90 to-white/60 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_0_0_1px_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.1)]">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-[12px] px-2 py-2 transition-all hover:bg-white/80',
              isActive && 'bg-white/80',
            )
          }
        >
          <div className="relative flex size-10.5 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-space-grey-800 via-space-grey to-space-grey-800 text-[13px] font-bold text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_6px_16px_-6px_rgba(15,23,42,0.4)]">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-[0_0_0_1px_rgba(16,185,129,0.4)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold tracking-tight text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-[11.5px] font-medium text-muted-foreground">
              {user.access} · {user.role}
            </p>
          </div>
        </NavLink>

        <div className="mt-1 space-y-0.5">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-[13px] font-medium text-muted-foreground/85 transition-colors hover:bg-white hover:text-foreground"
          >
            <Settings className="size-4 text-muted-foreground/70" />
            Settings
          </button>
          <button
            type="button"
            onClick={() => dispatch(logout())}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-[13px] font-medium text-muted-foreground/85 transition-colors hover:bg-white hover:text-destructive"
          >
            <LogOut className="size-4 text-muted-foreground/70 group-hover:text-destructive" />
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

export function SidebarContent() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#fdfbf7] via-[#fbf8f2] to-[#faf5ea] text-foreground">
      <SidebarBrand />
      <SidebarNav />
      <SidebarUser />
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] lg:block rounded-r-[28px] overflow-hidden shadow-[0_0_0_1px_rgba(15,23,42,0.035),0_30px_80px_-30px_rgba(15,23,42,0.2)]">
      <SidebarContent />
    </aside>
  )
}
