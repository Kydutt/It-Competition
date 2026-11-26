import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  CreditCard,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { publicService } from '../../services/publicService'
import { participantService } from '../../services/participantService'
import { openSnapCheckout } from '../../lib/midtrans'
import { formatDateTimeID, formatRupiah } from '../../utils/currency'
import { getPaymentDisplayInfo } from '../../utils/paymentStatus'
import type { ApiError } from '../../types/api'
import type { Payment, PaymentConfig } from '../../types/payment'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Pagination } from '../../components/ui/Pagination'
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge'

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiError>(err)) {
    return err.response?.data?.message || fallback
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth()

  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now())

  const [activePaymentId, setActivePaymentId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
  } | null>(null)

  const actionLockRef = useRef(false)

  const loadData = useCallback(async (targetPage: number) => {
    try {
      const [configRes, paymentsRes] = await Promise.all([
        publicService.getPaymentConfig(),
        participantService.getPayments({ page: targetPage, per_page: 15 }),
      ])
      setPaymentConfig(configRes.data)
      setPayments(paymentsRes.data || [])
      setNowTimestamp(Date.now())
      if (paymentsRes.meta) {
        setPagination({
          currentPage: paymentsRes.meta.current_page,
          lastPage: paymentsRes.meta.last_page,
          perPage: paymentsRes.meta.per_page,
          total: paymentsRes.meta.total,
        })
      }
      setError(null)
    } catch (err) {
      console.error('Failed to load payments:', err)
      setError(getErrorMessage(err, 'Gagal memuat riwayat transaksi pembayaran.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      publicService.getPaymentConfig(),
      participantService.getPayments({ page, per_page: 15 }),
    ])
      .then(([configRes, paymentsRes]) => {
        if (!active) return
        setPaymentConfig(configRes.data)
        setPayments(paymentsRes.data || [])
        setNowTimestamp(Date.now())
        if (paymentsRes.meta) {
          setPagination({
            currentPage: paymentsRes.meta.current_page,
            lastPage: paymentsRes.meta.last_page,
            perPage: paymentsRes.meta.per_page,
            total: paymentsRes.meta.total,
          })
        }
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        console.error('Failed to load payments:', err)
        setError(getErrorMessage(err, 'Gagal memuat riwayat transaksi pembayaran.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [page])

  const handleRetryLoad = () => {
    setIsLoading(true)
    void loadData(page)
  }

  const handleSync = useCallback(
    async (payment: Payment, triggerMessage?: string) => {
      if (actionLockRef.current) return
      actionLockRef.current = true
      setActivePaymentId(payment.id)
      setNotice({
        type: 'info',
        message: triggerMessage || `Memeriksa status transaksi ${payment.order_id} ke server...`,
      })

      try {
        const res = await participantService.syncPayment(payment.id)
        const updated = res.data
        await loadData(page)

        const info = getPaymentDisplayInfo(
          updated,
          updated.registration?.registration_fee_snapshot ?? updated.amount
        )
        setNotice({
          type: info.isSettled ? 'success' : info.isPending ? 'warning' : 'info',
          message: `Status terkini ${updated.order_id}: ${info.label}. ${info.description}`,
        })
      } catch (err) {
        console.error('Failed to sync payment:', err)
        setNotice({
          type: 'error',
          message: getErrorMessage(err, 'Gagal menyinkronkan status transaksi. Silakan coba lagi.'),
        })
      } finally {
        setActivePaymentId(null)
        actionLockRef.current = false
      }
    },
    [loadData, page]
  )

  const handleResumeSnap = async (payment: Payment) => {
    if (actionLockRef.current || !paymentConfig || !payment.snap_token) return
    actionLockRef.current = true
    setActivePaymentId(payment.id)
    setNotice(null)

    try {
      await openSnapCheckout(payment.snap_token, paymentConfig, {
        onSuccess: () => {
          actionLockRef.current = false
          void handleSync(
            payment,
            `Pembayaran ${payment.order_id} dikirim. Sedang memverifikasi status dari server...`
          )
        },
        onPending: () => {
          actionLockRef.current = false
          void handleSync(
            payment,
            `Transaksi ${payment.order_id} masih menunggu penyelesaian. Memeriksa status dari server...`
          )
        },
        onError: () => {
          actionLockRef.current = false
          void handleSync(
            payment,
            `Terjadi kendala pada Snap untuk ${payment.order_id}. Memeriksa status terbaru dari server...`
          )
        },
        onClose: () => {
          actionLockRef.current = false
          void handleSync(
            payment,
            `Jendela pembayaran ditutup. Memeriksa status ${payment.order_id} dari server...`
          )
        },
      })
    } catch (err) {
      console.error('Snap resume failed:', err)
      setNotice({
        type: 'error',
        message: getErrorMessage(err, 'Gagal membuka popup pembayaran Midtrans Snap.'),
      })
      setActivePaymentId(null)
      actionLockRef.current = false
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau status transaksi Midtrans Snap, nominal bersih, dan histori pengembalian dana untuk pendaftaran Anda maupun tim.
          </p>
        </div>

        <Link to="/participant/registrations">
          <Button variant="outline" size="sm">
            Lihat Pendaftaran Saya
          </Button>
        </Link>
      </div>

      {paymentConfig && !paymentConfig.payment_enabled && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Pembuatan transaksi pembayaran baru saat ini sedang dinonaktifkan oleh panitia. Anda tetap dapat melihat riwayat dan status transaksi yang sudah ada.
          </span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notice.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : notice.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={handleRetryLoad} />
      ) : isLoading ? (
        <CardSkeleton count={3} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-6 h-6" />}
          title="Belum Ada Riwayat Pembayaran"
          description="Transaksi pembayaran akan muncul di sini setelah Anda memulai pembayaran pada pendaftaran kompetisi berbayar yang telah dikirim (submitted)."
          action={
            <Link to="/participant/registrations">
              <Button variant="primary" size="sm">
                Buka Pendaftaran Saya
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {payments.map((tx) => {
            const comp = tx.registration?.competition
            const team = tx.registration?.team
            const snapshotFee = tx.registration?.registration_fee_snapshot ?? tx.amount
            const info = getPaymentDisplayInfo(tx, snapshotFee)
            const isExpiredLocally = Boolean(
              tx.status === 'pending' &&
                tx.expired_at &&
                new Date(tx.expired_at).getTime() <= nowTimestamp
            )
            const deadlinePassed = Boolean(
              comp?.registration_deadline &&
                new Date(comp.registration_deadline).getTime() <= nowTimestamp
            )
            const isLeaderOrOwner =
              !team || !user || team.leader_id === user.id || tx.user_id === user.id

            const canResumeCheckout = Boolean(
              paymentConfig?.payment_enabled &&
                paymentConfig.client_key &&
                tx.status === 'pending' &&
                !isExpiredLocally &&
                !deadlinePassed &&
                isLeaderOrOwner &&
                tx.snap_token
            )

            const isBusy = activePaymentId === tx.id

            return (
              <Card key={tx.id} className="p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                        {tx.order_id}
                      </span>
                      <PaymentStatusBadge payment={tx} competitionFee={snapshotFee} size="md" />
                      {info.subLabel && (
                        <Badge variant={info.variant} size="sm">
                          {info.subLabel}
                        </Badge>
                      )}
                      {tx.payment_type && (
                        <span className="text-[11px] font-mono uppercase text-slate-500">
                          {tx.payment_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {comp?.name || 'Kompetisi'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        No. Pendaftaran:{' '}
                        <span className="font-mono font-semibold text-slate-700">
                          {tx.registration?.registration_number || '-'}
                        </span>
                        {team ? ` • Tim: ${team.name}` : ' • Individu'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {info.description}
                    </p>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 pt-1">
                      <span>
                        Nominal:{' '}
                        <strong className="text-slate-900">{formatRupiah(tx.amount)}</strong>
                      </span>
                      <span>Transaksi: {formatDateTimeID(tx.created_at)}</span>
                      <span>
                        {tx.paid_at
                          ? `Lunas: ${formatDateTimeID(tx.paid_at)}`
                          : `Batas Bayar: ${formatDateTimeID(tx.expired_at)}`}
                      </span>
                    </div>

                    {tx.reversal_history && tx.reversal_history.length > 0 && (
                      <div className="mt-2 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Riwayat Pengembalian Dana / Chargeback</span>
                        </div>
                        {tx.reversal_history.map((rev, idx) => (
                          <div key={`${tx.id}-hist-${idx}`}>
                            • <strong className="uppercase">{rev.type}</strong>:{' '}
                            {rev.refund_amount !== null ? formatRupiah(rev.refund_amount) : '-'}
                            {rev.net_paid_amount !== null &&
                              ` (Nominal bersih tersisa: ${formatRupiah(rev.net_paid_amount)})`}
                            {rev.recorded_at && ` — ${formatDateTimeID(rev.recorded_at)}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {canResumeCheckout && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={isBusy}
                        disabled={activePaymentId !== null}
                        onClick={() => void handleResumeSnap(tx)}
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                      >
                        Lanjutkan Pembayaran
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={isBusy}
                      disabled={activePaymentId !== null}
                      onClick={() => void handleSync(tx)}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Cek Status
                    </Button>

                    <Link to={`/participant/registrations/${tx.registration_id}`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Detail
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}

          <Pagination
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            perPage={pagination.perPage}
            total={pagination.total}
            onPageChange={(nextPage) => {
              setIsLoading(true)
              setPage(nextPage)
            }}
          />
        </div>
      )}
    </div>
  )
}
