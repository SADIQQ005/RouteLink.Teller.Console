import { createBaasClient } from '@/services/baas/client'
import { BAAS_AUTH_LOGIN_PATH } from '@/services/config'

export interface EntraIdLoginInput {
  usernameOrEmail: string
  password: string
}

export interface EntraIdLoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

/** Authenticate against BaaS Entra ID and return an access token. */
export async function entraIdLogin(
  input: EntraIdLoginInput,
): Promise<EntraIdLoginResponse> {
  const client = createBaasClient()
  const { data } = await client.post<EntraIdLoginResponse>(
    BAAS_AUTH_LOGIN_PATH,
    input,
  )
  return data
}
