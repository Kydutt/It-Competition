import type { ApiResponse } from './api'

export type PaymentStatusType =
  | 'pending'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'failed'
  | 'verified'
  | 'rejected'

export interface PaymentConfig {
  payment_enabled: boolean
  client_key: string
  snap_script_url: string
  is_production: boolean
}

export interface ReversalHistoryEntry {
  type: string | null
  refund_key: string | null
  refund_chargeback_id: string | null
  refund_amount: number | null
  cumulative_refunded_amount: number | null
  net_paid_amount: number | null
  recorded_at: string | null
  source: string | null
}

export interface PaymentRegistrationSummary {
  id: number
  registration_number: string
  status: string
  registration_fee_snapshot?: number | null
  fee_locked_at?: string | null
  competition?: {
    id: number
    event_id?: number | null
    name: string
    slug: string
    registration_fee: number
    registration_deadline?: string | null
  } | null
  team?: {
    id: number
    name: string
    team_code: string
    leader_id?: number | null
  } | null
}

export interface PaymentPayerSummary {
  id: number
  name: string
  email: string
}

export interface Payment {
  id: number
  order_id: string
  registration_id: number
  user_id: number | null
  gateway: string
  amount: number
  payment_method: string | null
  payment_type: string | null
  status: PaymentStatusType
  status_label: string
  reversal_reason?: string | null
  cumulative_refunded_amount?: number | null
  net_paid_amount?: number | null
  reversal_history?: ReversalHistoryEntry[]
  snap_token?: string | null
  snap_redirect_url?: string | null
  midtrans_transaction_id: string | null
  midtrans_transaction_status: string | null
  fraud_status: string | null
  paid_at: string | null
  expired_at: string | null
  registration?: PaymentRegistrationSummary
  payer?: PaymentPayerSummary
  created_at: string
  updated_at: string
}

export interface SnapCallbackPayload {
  order_id?: string
  status_code?: string
  transaction_status?: string
  payment_type?: string
  status_message?: string
}

export interface SnapCallbacks {
  onSuccess?: (result: SnapCallbackPayload) => void
  onPending?: (result: SnapCallbackPayload) => void
  onError?: (result: SnapCallbackPayload) => void
  onClose?: () => void
}

export type PaymentConfigResponse = ApiResponse<PaymentConfig>
export type PaymentListResponse = ApiResponse<Payment[]>
export type PaymentDetailResponse = ApiResponse<Payment>
