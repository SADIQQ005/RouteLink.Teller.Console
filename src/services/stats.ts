import { http } from '@/services/http'
import type { DashboardStats } from '@/lib/data'

export function getStats(): Promise<DashboardStats> {
  return http.get<DashboardStats>('/stats')
}