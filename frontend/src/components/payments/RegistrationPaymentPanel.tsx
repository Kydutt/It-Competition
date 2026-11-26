import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react'
import { publicService } from '../../services/publicService'
import { participantService } from '../../services/participantService'
import { openSnapCheckout } from '../../lib/midtrans'
import {
  formatCompetitionFee,
  formatDateTimeID,
  formatRegistrationFee,
  formatRupiah,
  getLockedRegistrationFee,
} from '../../utils/currency'
import { getPaymentDisplayInfo } from '../../utils/paymentStatus'
import type { ApiError, User } from '../../types/api'
import type { Payment, PaymentConfig } from '../../types/payment'
import type { Registration } from '../../types/participant'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { PaymentStatusBadge } from './PaymentStatusBadge'

interface RegistrationPaymentPanelProps {
  registration: Registration
  currentUser: User | null
  onPaymentUpdated: () => Promise<void>
}

function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiError>(err)) {
    const data = err.response?.data
    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0]
      if (firstError) return firstError
    }
    if (data?.message) {
      return data.message
    }
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

export const RegistrationPaymentPanel: React.FC<RegistrationPaymentPanelProps> = ({
  registration,
  currentUser,
  onPaymentUpdated,
}) => {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now())

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [statusNotice, setStatusNotice] = useState<{
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
  } | null>(null)

  const checkoutLockRef = useRef(false)
  const syncLockRef = useRef(false)

  const competition = registration.competition
  const lockedFee = getLockedRegistrationFee(registration)
  const isFeeUnresolved = lockedFee === null
  const fee = lockedFee ?? 0
  const isPaidCompetition = !isFeeUnresolved && fee > 0
  const eventId = competition?.event?.id

  const loadPaymentData = useCallback(async () => {
    try {
      const [configRes, listRes] = await Promise.all([
        publicService.getPaymentConfig(eventId),
        participantService.getRegistrationPayments(registration.id, { per_page: 20 }),
      ])
      setPaymentConfig(configRes.data)
      setPayments(listRes.data || [])
      setNowTimestamp(Date.now())
      setConfigError(null)
    } catch (err) {
      console.error('Failed to load payment info:', err)
      setConfigError(extractApiErrorMessage(err, 'Gagal memuat informasi pembayaran dari server.'))
    } finally {
      setIsLoadingMeta(false)
    }
  }, [eventId, registration.id])

  useEffect(() => {
    let active = true
    Promise.all([
      publicService.getPaymentConfig(eventId),
      participantService.getRegistrationPayments(registration.id, { per_page: 20 }),
    ])
      .then(([configRes, listRes]) => {
        if (!active) return
        setPaymentConfig(configRes.data)
        setPayments(listRes.data || [])
        setNowTimestamp(Date.now())
        setConfigError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        console.error('Failed to load payment info:', err)
        setConfigError(extractApiErrorMessage(err, 'Gagal memuat informasi pembayaran dari server.'))
      })
      .finally(() => {
        if (active) setIsLoadingMeta(false)
      })

    return () => {
      active = false
    }
  }, [eventId, registration.id])

  const latestPayment: Payment | null =
    payments[0] ?? registration.latest_payment ?? null

  const settledPayment =
    payments.find((p) => p.status === 'paid' || p.status === 'verified') ??
    (latestPayment && (latestPayment.status === 'paid' || latestPayment.status === 'verified')
      ? latestPayment
      : null)

  const displayPayment = settledPayment ?? latestPayment
  const displayInfo = getPaymentDisplayInfo(displayPayment, fee)

  // Ownership / Team leadership check (PD-05)
  const isTeamRegistration = Boolean(registration.team)
  const isTeamLeader = Boolean(
    registration.team &&
      currentUser &&
      (registration.team.leader?.id === currentUser.id ||
        registration.team.members?.some(
          (member) => member.id === currentUser.id && member.member_role === 'leader'
        ))
  )
  const isIndividualOwner = Boolean(
    !isTeamRegistration &&
      currentUser &&
      (registration.participant?.id === currentUser.id ||
        displayPayment?.user_id === currentUser.id)
  )
  const canInitiateByRole = isTeamRegistration ? isTeamLeader : isIndividualOwner

  const isStatusPayable =
    registration.status === 'submitted' || registration.status === 'under_review'

  const registrationDeadlinePassed = Boolean(
    competition?.registration_deadline &&
      new Date(competition.registration_deadline).getTime() <= nowTimestamp
  )

  const isLatestPendingExpired = Boolean(
    displayPayment?.status === 'pending' &&
      displayPayment.expired_at &&
      new Date(displayPayment.expired_at).getTime() <= nowTimestamp
  )

  const canShowPayButton =
    isPaidCompetition &&
    Boolean(paymentConfig?.payment_enabled) &&
    Boolean(paymentConfig?.client_key) &&
    canInitiateByRole &&
    isStatusPayable &&
    !settledPayment &&
    !registrationDeadlinePassed

  const handleSyncPayment = useCallback(
    async (paymentId: number, triggerMessage?: string) => {
      if (syncLockRef.current) return
      syncLockRef.current = true
      setIsSyncing(true)
      setStatusNotice({
        type: 'info',
        message:
          triggerMessage || 'Sedang memeriksa status pembayaran terbaru ke server...',
      })

      try {
        const res = await participantService.syncPayment(paymentId)
        const updated = res.data
        await Promise.all([loadPaymentData(), onPaymentUpdated()])

        const updatedInfo = getPaymentDisplayInfo(updated, fee)
        if (updatedInfo.isSettled) {
          setStatusNotice({
            type: 'success',
            message:
              'Pembayaran telah dikonfirmasi berhasil oleh server. Pendaftaran tetap mengikuti verifikasi berkas panitia.',
          })
        } else if (updatedInfo.isPending) {
          setStatusNotice({
            type: 'warning',
            message:
              'Status pembayaran masih Menunggu Pembayaran (pending) di server. Jika Anda baru saja menyelesaikan pembayaran, klik "Cek Status Pembayaran" beberapa saat lagi.',
          })
        } else {
          setStatusNotice({
            type: updatedInfo.variant === 'danger' ? 'error' : 'info',
            message: `Status terbaru dari server: ${updatedInfo.label}. ${updatedInfo.description}`,
          })
        }
      } catch (err) {
        console.error('Payment sync failed:', err)
        setStatusNotice({
          type: 'error',
          message: extractApiErrorMessage(
            err,
            'Gagal menyinkronkan status pembayaran dengan server. Silakan coba klik Cek Status lagi.'
          ),
        })
      } finally {
        setIsSyncing(false)
        syncLockRef.current = false
      }
    },
    [fee, loadPaymentData, onPaymentUpdated]
  )

  const handleCheckout = async () => {
    if (checkoutLockRef.current || isCheckingOut || !paymentConfig) return
    checkoutLockRef.current = true
    setIsCheckingOut(true)
    setStatusNotice(null)

    try {
      // Reuse active pending Snap token from backend if valid, otherwise request/create from backend
      let targetPayment: Payment | null =
        displayPayment &&
        displayPayment.status === 'pending' &&
        !isLatestPendingExpired &&
        displayPayment.snap_token
          ? displayPayment
          : null

      if (!targetPayment) {
        const res = await participantService.createOrReusePayment(registration.id)
        targetPayment = res.data
        await loadPaymentData()
      }

      if (!targetPayment?.snap_token) {
        throw new Error(
          'Token pembayaran Snap belum tersedia dari server. Silakan muat ulang status pembayaran.'
        )
      }

      const activePaymentId = targetPayment.id

      await openSnapCheckout(targetPayment.snap_token, paymentConfig, {
        onSuccess: () => {
          void handleSyncPayment(
            activePaymentId,
            'Pembayaran dikirim. Sedang memverifikasi status pembayaran dengan server...'
          )
        },
        onPending: () => {
          void handleSyncPayment(
            activePaymentId,
            'Transaksi menunggu penyelesaian pembayaran. Memeriksa status terbaru dari server...'
          )
        },
        onError: () => {
          setStatusNotice({
            type: 'error',
            message:
              'Terjadi kendala saat memproses pembayaran di Midtrans Snap. Silakan periksa status transaksi atau coba lagi.',
          })
          void handleSyncPayment(
            activePaymentId,
            'Memeriksa status transaksi terbaru setelah kendala Snap...'
          )
        },
        onClose: () => {
          void handleSyncPayment(
            activePaymentId,
            'Jendela pembayaran ditutup. Memeriksa status pembayaran terbaru dari server...'
          )
        },
      })
    } catch (err) {
      console.error('Checkout initiation failed:', err)
      setStatusNotice({
        type: 'error',
        message: extractApiErrorMessage(
          err,
          'Tidak dapat memulai pembayaran Midtrans Snap saat ini. Silakan coba lagi.'
        ),
      })
      await loadPaymentData()
    } finally {
      setIsCheckingOut(false)
      checkoutLockRef.current = false
    }
  }

  return (
    <Card className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[var(--color-brand-blue)]" />
          <h3 className="font-bold text-base text-slate-900">Informasi Pembayaran Pendaftaran</h3>
        </div>
        {isFeeUnresolved ? (
          <Badge variant="warning" size="md">
            Biaya Perlu Konfirmasi
          </Badge>
        ) : isPaidCompetition ? (
          <PaymentStatusBadge payment={displayPayment} competitionFee={fee} size="md" />
        ) : (
          <Badge variant="success" size="md">
            Kompetisi Gratis
          </Badge>
        )}
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-[#FAF9F5] border border-[#E9E5DA] text-xs">
        <div>
          <span className="text-slate-500 block">Biaya Pendaftaran</span>
          <span className="font-extrabold text-base text-[#17243A]">
            {formatRegistrationFee(lockedFee)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Kewajiban Pembayaran</span>
          <span className="font-semibold text-slate-800">
            {isFeeUnresolved
              ? 'Menunggu konfirmasi tarif oleh panitia'
              : isPaidCompetition
              ? 'Wajib lunas sebelum persetujuan panitia'
              : 'Tidak memerlukan pembayaran'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">
            {registration.team ? 'Nama Tim' : 'Nama Pendaftar'}
          </span>
          <span className="font-semibold text-slate-800">
            {registration.team ? registration.team.name : registration.participant?.name || '-'}
          </span>
        </div>

        {displayPayment && (
          <>
            <div>
              <span className="text-slate-500 block">Kode Transaksi (Order ID)</span>
              <span className="font-mono font-bold text-slate-800 break-all">
                {displayPayment.order_id}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Waktu Transaksi</span>
              <span className="font-semibold text-slate-800">
                {formatDateTimeID(displayPayment.created_at)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">
                {displayPayment.paid_at ? 'Waktu Terkonfirmasi Lunas' : 'Batas Pembayaran'}
              </span>
              <span className="font-semibold text-slate-800">
                {displayPayment.paid_at
                  ? formatDateTimeID(displayPayment.paid_at)
                  : formatDateTimeID(displayPayment.expired_at)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Unresolved Historical Snapshot Warning */}
      {isFeeUnresolved && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Biaya Pendaftaran Sedang Menunggu Verifikasi Panitia</p>
            <p className="text-amber-800 leading-relaxed">
              Snapshot biaya pendaftaran untuk registrasi ini belum terkonfirmasi. Pembuatan transaksi pembayaran dan persetujuan pendaftaran ditahan sementara hingga panitia menyelesaikan verifikasi tarif.
            </p>
          </div>
        </div>
      )}

      {/* Locked Snapshot Notice if competition fee changed after registration */}
      {!isFeeUnresolved &&
        competition?.registration_fee !== undefined &&
        Number(competition.registration_fee) !== fee && (
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#1769AA] shrink-0 mt-0.5" />
            <span>
              Tarif pendaftaran Anda terkunci sebesar{' '}
              <strong>{formatCompetitionFee(fee)}</strong> saat pendaftaran dibuat (tarif cabang terbaru saat ini:{' '}
              <strong>{formatCompetitionFee(competition.registration_fee)}</strong>). Perubahan harga cabang tidak mengubah nominal pendaftaran Anda.
            </span>
          </div>
        )}

      {/* Free Competition Info */}
      {!isFeeUnresolved && !isPaidCompetition && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Kompetisi Ini Gratis</p>
            <p className="text-emerald-800 leading-relaxed">
              Cabang kompetisi ini tidak mengenakan biaya pendaftaran. Pendaftaran Anda langsung diproses melalui tahap peninjauan dokumen oleh panitia.
            </p>
          </div>
        </div>
      )}

      {/* Config load failure */}
      {isPaidCompetition && configError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{configError}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoadingMeta(true)
              setConfigError(null)
              void loadPaymentData()
            }}
          >
            Muat Ulang
          </Button>
        </div>
      )}

      {/* Paid Competition Details & Action Controls */}
      {isPaidCompetition && !isLoadingMeta && (
        <div className="space-y-4">
          {/* Status Description Banner */}
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              displayInfo.isSettled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : displayInfo.variant === 'danger'
                ? 'bg-red-50 border-red-200 text-red-900'
                : displayInfo.variant === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {displayInfo.isSettled ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : displayInfo.isReversal ? (
              <RotateCcw className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{displayInfo.label}</p>
                {displayInfo.subLabel && (
                  <Badge variant={displayInfo.variant} size="sm">
                    {displayInfo.subLabel}
                  </Badge>
                )}
                {displayPayment?.payment_type && (
                  <span className="text-[11px] uppercase font-mono text-slate-500">
                    ({displayPayment.payment_type.replace(/_/g, ' ')})
                  </span>
                )}
              </div>
              <p className="leading-relaxed">{displayInfo.description}</p>

              {/* Traceable Reversal Summary */}
              {displayPayment &&
                (displayPayment.cumulative_refunded_amount !== null &&
                  displayPayment.cumulative_refunded_amount !== undefined) && (
                  <div className="mt-2 pt-2 border-t border-current/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <span>
                      Total Dana Dikembalikan:{' '}
                      <strong>{formatRupiah(displayPayment.cumulative_refunded_amount)}</strong>
                    </span>
                    {displayPayment.net_paid_amount !== null &&
                      displayPayment.net_paid_amount !== undefined && (
                        <span>
                          Nominal Bersih Tersisa:{' '}
                          <strong>{formatRupiah(displayPayment.net_paid_amount)}</strong>
                        </span>
                      )}
                  </div>
                )}

              {displayPayment?.status === 'pending' && isLatestPendingExpired && (
                <p className="text-red-700 font-semibold mt-1">
                  Batas pembayaran transaksi ini telah lewat ({formatDateTimeID(displayPayment.expired_at)}). Klik Cek Status atau buat transaksi baru.
                </p>
              )}
            </div>
          </div>

          {/* Live Action Notice */}
          {statusNotice && (
            <div
              role="status"
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusNotice.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : statusNotice.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}
            >
              {statusNotice.type === 'error' ? (
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusNotice.message}</span>
            </div>
          )}

          {/* Contextual Guard Notices */}
          {!isStatusPayable && !settledPayment && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              {registration.status === 'draft' || registration.status === 'revision_required'
                ? 'Pembayaran baru dapat dilakukan setelah Anda mengunggah berkas persyaratan dan menekan tombol "Kirim Pendaftaran Sekarang".'
                : 'Status pendaftaran saat ini tidak lagi membuka pembuatan transaksi pembayaran baru.'}
            </div>
          )}

          {isStatusPayable && !settledPayment && paymentConfig && !paymentConfig.payment_enabled && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Pembuatan transaksi pembayaran baru saat ini sedang dinonaktifkan oleh panitia. Anda tetap dapat memantau riwayat transaksi di bawah ini.
            </div>
          )}

          {isStatusPayable && !settledPayment && isTeamRegistration && !isTeamLeader && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
              Anda masuk sebagai anggota tim. Hanya <strong>Ketua Tim</strong> yang dapat memulai atau melanjutkan transaksi pembayaran, sedangkan seluruh anggota dapat memantau status dan melakukan sinkronisasi pengecekan status.
            </div>
          )}

          {isStatusPayable && !settledPayment && registrationDeadlinePassed && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              Batas akhir pendaftaran kompetisi telah berakhir sehingga transaksi pembayaran baru tidak dapat dibuat.
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {canShowPayButton && (
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isCheckingOut}
                disabled={isCheckingOut || isSyncing}
                onClick={handleCheckout}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                {displayPayment?.status === 'pending' && !isLatestPendingExpired
                  ? 'Lanjutkan Pembayaran'
                  : displayPayment
                  ? 'Buat Transaksi Baru'
                  : 'Bayar Sekarang'}
              </Button>
            )}

            {displayPayment && (
              <Button
                type="button"
                variant="outline"
                size="md"
                isLoading={isSyncing}
                disabled={isSyncing || isCheckingOut}
                onClick={() => void handleSyncPayment(displayPayment.id)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Cek Status Pembayaran
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Transaction History Table for this Registration */}
      {isPaidCompetition && payments.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Riwayat Transaksi Pendaftaran ({payments.length})
          </h4>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {payments.map((tx) => {
              const txInfo = getPaymentDisplayInfo(tx, fee)
              return (
                <div
                  key={tx.id}
                  className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{tx.order_id}</span>
                      <PaymentStatusBadge payment={tx} competitionFee={fee} />
                      {txInfo.subLabel && (
                        <span className="text-[11px] font-medium text-slate-500">
                          • {txInfo.subLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Nominal: <strong className="text-slate-700">{formatRupiah(tx.amount)}</strong></span>
                      <span>Dibuat: {formatDateTimeID(tx.created_at)}</span>
                      <span>
                        {tx.paid_at
                          ? `Lunas: ${formatDateTimeID(tx.paid_at)}`
                          : `Batas: ${formatDateTimeID(tx.expired_at)}`}
                      </span>
                    </div>
                    {tx.reversal_history && tx.reversal_history.length > 0 && (
                      <div className="mt-1.5 pl-2.5 border-l-2 border-amber-300 space-y-0.5 text-[11px] text-slate-600">
                        {tx.reversal_history.map((rev, idx) => (
                          <div key={`${tx.id}-rev-${idx}`}>
                            <span className="font-semibold uppercase">{rev.type}:</span>{' '}
                            {rev.refund_amount !== null ? formatRupiah(rev.refund_amount) : 'Nominal tercatat'}
                            {rev.net_paid_amount !== null && ` • Sisa bersih: ${formatRupiah(rev.net_paid_amount)}`}
                            {rev.recorded_at && ` (${formatDateTimeID(rev.recorded_at)})`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSyncing || isCheckingOut}
                      onClick={() => void handleSyncPayment(tx.id)}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Sinkronkan
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
