import React from 'react'
import { Badge } from '../ui/Badge'
import type { Payment } from '../../types/payment'
import { getPaymentDisplayInfo } from '../../utils/paymentStatus'

interface PaymentStatusBadgeProps {
  payment: Payment | null | undefined
  competitionFee?: number
  size?: 'sm' | 'md'
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  payment,
  competitionFee,
  size = 'sm',
}) => {
  const info = getPaymentDisplayInfo(payment, competitionFee)

  return (
    <Badge variant={info.variant} size={size}>
      {info.label}
    </Badge>
  )
}
