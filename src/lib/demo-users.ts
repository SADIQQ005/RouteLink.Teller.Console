import type { User } from '@/store/slices/auth-slice'

export const makerUser: User = {
  id: 'usr_001',
  firstName: 'Adaeze',
  lastName: 'Okafor',
  email: 'adaeze.okafor@routelink.io',
  role: 'Senior Teller',
  branch: 'Head Office · Lagos',
  tier: 'Maker',
  access: 'Maker',
  lastLogin: '27 Aug 2026 · 09:14',
  twoFactorEnabled: false,
}

export const checkerUser: User = {
  id: 'usr_003',
  firstName: 'Bola',
  lastName: 'Adeyemi',
  email: 'bola.adeyemi@routelink.io',
  role: 'Approval Officer',
  branch: 'Head Office · Lagos',
  tier: 'Checker',
  access: 'Checker',
  lastLogin: '27 Aug 2026 · 08:02',
  twoFactorEnabled: false,
}

export function pickDemoUser(email: string): User {
  return /checker|bola|adeyemi/i.test(email) ? checkerUser : makerUser
}