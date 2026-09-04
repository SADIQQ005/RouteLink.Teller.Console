import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveTransfer,
  createTransfer,
  getApprovalQueue,
  getBanks,
  rejectTransfer,
  verifyApprovalOtp,
  verifyCustomerOtp,
} from '@/services/baas'
import type {
  ApprovalQueueParams,
  ApproveTransferInput,
  CreateTransferInput,
  RejectTransferInput,
  VerifyApprovalOtpInput,
  VerifyCustomerOtpInput,
} from '@/services/baas'

export const baasQueryKeys = {
  banks: ['baas', 'banks'] as const,
  approvals: (params: ApprovalQueueParams) =>
    ['baas', 'approvals', params] as const,
  transfer: (id: string) => ['baas', 'transfers', id] as const,
}

export function useBanks() {
  return useQuery({
    queryKey: baasQueryKeys.banks,
    queryFn: getBanks,
  })
}

export function useApprovalQueue(params: ApprovalQueueParams) {
  return useQuery({
    queryKey: baasQueryKeys.approvals(params),
    queryFn: () => getApprovalQueue(params),
  })
}

export function useCreateBaasTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTransferInput) => createTransfer(payload),
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({
        queryKey: baasQueryKeys.transfer(transfer.transferRequestId),
      })
      queryClient.invalidateQueries({ queryKey: ['baas'] })
    },
  })
}

export function useVerifyCustomerOtp(transferId: string) {
  return useMutation({
    mutationFn: (payload: VerifyCustomerOtpInput) =>
      verifyCustomerOtp(transferId, payload),
  })
}

export function useApproveTransfer(transferId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApproveTransferInput) =>
      approveTransfer(transferId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baas'] })
    },
  })
}

export function useVerifyApprovalOtp(transferId: string) {
  return useMutation({
    mutationFn: (payload: VerifyApprovalOtpInput) =>
      verifyApprovalOtp(transferId, payload),
  })
}

export function useRejectTransfer(transferId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RejectTransferInput) =>
      rejectTransfer(transferId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baas'] })
    },
  })
}
