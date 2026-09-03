import { createBaasClient } from '@/services/baas/client'
import type { Bank } from '@/services/baas/types'

export async function getBanks(): Promise<Bank[]> {
  const client = createBaasClient()
  const { data } = await client.get<Bank[]>('/api/v1/routeops/banks')
  return data
}
