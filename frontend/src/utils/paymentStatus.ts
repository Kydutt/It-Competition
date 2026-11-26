import type { BadgeProps } from '../components/ui/Badge'
import type { Payment } from '../types/payment'
import { formatRupiah } from './currency'

export interface PaymentDisplayInfo {
  label: string
  subLabel?: string
  description: string
  variant: NonNullable<BadgeProps['variant']>
  isSettled: boolean
  isPending: boolean
  isRetryable: boolean
  isReversal: boolean
}

export function getPaymentDisplayInfo(
  payment: Payment | null | undefined,
  competitionFee?: number
): PaymentDisplayInfo {
  if (!payment) {
    return {
      label: 'Belum Dibayar',
      description: 'Belum ada transaksi pembayaran yang dibuat untuk pendaftaran ini.',
      variant: 'default',
      isSettled: false,
      isPending: false,
      isRetryable: true,
      isReversal: false,
    }
  }

  const providerStatus = (payment.midtrans_transaction_status || '').toLowerCase()
  const fraudStatus = (payment.fraud_status || '').toLowerCase()
  const requiredFee =
    competitionFee ??
    payment.registration?.registration_fee_snapshot ??
    payment.registration?.competition?.registration_fee ??
    payment.amount
  const netPaid = payment.net_paid_amount
  const totalRefunded = payment.cumulative_refunded_amount

  if (providerStatus === 'chargeback' || providerStatus === 'partial_chargeback') {
    return {
      label: 'Dalam Proses Chargeback',
      subLabel: providerStatus === 'partial_chargeback' ? 'Chargeback Sebagian' : 'Chargeback Penuh',
      description:
        payment.reversal_reason ||
        'Transaksi mengalami chargeback dari penerbit/bank. Pembayaran tidak lagi dianggap lunas dan pendaftaran tidak dapat disetujui.',
      variant: 'danger',
      isSettled: false,
      isPending: false,
      isRetryable: true,
      isReversal: true,
    }
  }

  if (providerStatus === 'refund' && payment.status === 'cancelled') {
    return {
      label: 'Dana Dikembalikan',
      subLabel: totalRefunded !== null && totalRefunded !== undefined ? `Refund ${formatRupiah(totalRefunded)}` : 'Refund Penuh',
      description:
        payment.reversal_reason ||
        'Dana pembayaran telah dikembalikan penuh. Pendaftaran memerlukan transaksi pembayaran baru apabila masih ingin mengikuti kompetisi.',
      variant: 'info',
      isSettled: false,
      isPending: false,
      isRetryable: true,
      isReversal: true,
    }
  }

  if (providerStatus === 'partial_refund') {
    if (payment.status === 'paid' || payment.status === 'verified') {
      return {
        label: 'Pembayaran Berhasil',
        subLabel: 'Pengembalian Dana Sebagian',
        description:
          netPaid !== null && netPaid !== undefined
            ? `Terdapat pengembalian dana sebagian (${formatRupiah(totalRefunded ?? 0)}), namun nominal bersih (${formatRupiah(netPaid)}) masih mencukupi biaya pendaftaran (${formatRupiah(requiredFee)}).`
            : 'Terdapat pengembalian dana sebagian dan nominal bersih masih mencukupi biaya pendaftaran.',
        variant: 'success',
        isSettled: true,
        isPending: false,
        isRetryable: false,
        isReversal: true,
      }
    }

    if (payment.status === 'cancelled') {
      return {
        label: 'Dana Dikembalikan',
        subLabel: 'Akumulasi Refund Penuh',
        description:
          payment.reversal_reason ||
          'Akumulasi pengembalian dana mencapai total transaksi sehingga pembayaran dibatalkan dan tidak lagi lunas.',
        variant: 'info',
        isSettled: false,
        isPending: false,
        isRetryable: true,
        isReversal: true,
      }
    }

    return {
      label: 'Dana Pembayaran Tidak Mencukupi',
      subLabel: 'Pengembalian Dana Sebagian',
      description:
        netPaid !== null && netPaid !== undefined
          ? `Terjadi pengembalian dana sebagian (${formatRupiah(totalRefunded ?? 0)}). Sisa dana bersih ${formatRupiah(netPaid)} kurang dari biaya pendaftaran ${formatRupiah(requiredFee)}, sehingga diperlukan pembayaran baru.`
          : payment.reversal_reason ||
            'Terjadi pengembalian dana sebagian sehingga sisa nominal bersih tidak lagi mencukupi biaya pendaftaran.',
      variant: 'warning',
      isSettled: false,
      isPending: false,
      isRetryable: true,
      isReversal: true,
    }
  }

  if (payment.status === 'paid' || payment.status === 'verified') {
    return {
      label: 'Pembayaran Berhasil',
      description:
        'Pembayaran telah dikonfirmasi oleh backend dan Midtrans. Persetujuan pendaftaran tetap menunggu peninjauan dokumen oleh panitia.',
      variant: 'success',
      isSettled: true,
      isPending: false,
      isRetryable: false,
      isReversal: false,
    }
  }

  if (payment.status === 'pending') {
    if (providerStatus === 'capture' && fraudStatus === 'challenge') {
      return {
        label: 'Menunggu Pembayaran',
        subLabel: 'Dalam Pemeriksaan Keamanan',
        description:
          'Transaksi sedang ditinjau sistem deteksi keamanan Midtrans (challenge) dan belum dikonfirmasi lunas. Gunakan tombol Cek Status untuk memeriksa pembaruan.',
        variant: 'warning',
        isSettled: false,
        isPending: true,
        isRetryable: false,
        isReversal: false,
      }
    }

    return {
      label: 'Menunggu Pembayaran',
      description:
        'Transaksi aktif tersedia. Selesaikan pembayaran sebelum batas waktu berakhir, atau klik Cek Status setelah membayar.',
      variant: 'warning',
      isSettled: false,
      isPending: true,
      isRetryable: false,
      isReversal: false,
    }
  }

  if (payment.status === 'expired') {
    return {
      label: 'Kedaluwarsa',
      description: 'Batas waktu transaksi ini telah berakhir. Anda dapat membuat transaksi baru apabila pendaftaran masih dibuka.',
      variant: 'default',
      isSettled: false,
      isPending: false,
      isRetryable: true,
      isReversal: false,
    }
  }

  if (payment.status === 'cancelled') {
    return {
      label: 'Dibatalkan',
      description:
        payment.reversal_reason ||
        'Transaksi pembayaran dibatalkan dan tidak berlaku lagi. Anda dapat memulai transaksi baru jika diperlukan.',
      variant: 'default',
      isSettled: false,
      isPending: false,
      isRetryable: true,
      isReversal: false,
    }
  }

  if (payment.status === 'failed') {
    return {
      label: 'Pembayaran Gagal',
      description: 'Transaksi pembayaran ditolak atau gagal diproses oleh bank/payment gateway. Silakan coba buat transaksi baru.',
      variant: 'danger',
      isSettled: false,
      isPending: false,
      isRetryable: true,
      isReversal: false,
    }
  }

  return {
    label: 'Pembayaran Tidak Berlaku',
    description: payment.reversal_reason || 'Status transaksi tidak berlaku untuk persetujuan dan memerlukan pembayaran baru.',
    variant: 'danger',
    isSettled: false,
    isPending: false,
    isRetryable: true,
    isReversal: false,
  }
}
