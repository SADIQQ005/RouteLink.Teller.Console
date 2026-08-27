import {
  LayoutDashboard,
  Send,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavSubItem {
  title: string
  path: string
  badge?: number
}

export interface NavItem {
  title: string
  path?: string
  icon: LucideIcon
  badge?: number
  children?: NavSubItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: '',
    items: [
      {
        title: 'Payments',
        icon: Send,
        children: [
          { title: 'New Transaction', path: '/payments/new' },
          { title: 'Transactions', path: '/payments/transactions', badge: 3 },
        ],
      },
    ],
  },
  {
    label: '',
    items: [
      {
        title: 'Account',
        icon: Wallet,
        children: [
          { title: 'Approval Queue', path: '/account/approval-queue', badge: 8 },
          { title: 'Reconciliation', path: '/account/reconciliation' },
          { title: 'Audit Trail', path: '/account/audit-trail' },
        ],
      },
    ],
  },
  {
    label: '',
    items: [
      {
        title: 'Administration',
        icon: ShieldCheck,
        children: [
          { title: 'Users', path: '/administration/users' },
          {
            title: 'Transaction Limits',
            path: '/administration/transaction-limits',
          },
          {
            title: 'Approval Roles',
            path: '/administration/approval-roles',
          },
        ],
      },
    ],
  },
]
