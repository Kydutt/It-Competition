import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  PlusCircle,
  Users,
  Calendar,
  AlertCircle,
  FileCheck,
  ChevronRight,
} from 'lucide-react'
import { participantService } from '../../services/participantService'
import { formatRegistrationFee, getLockedRegistrationFee } from '../../utils/currency'
import type { Registration } from '../../types/participant'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge'

export const RegistrationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeStatus = searchParams.get('status') || ''

  const fetchRegistrations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await participantService.getRegistrations({
        status: activeStatus || undefined,
      })
      setRegistrations(res.data || [])
    } catch (err) {
      console.error('Failed to load registrations:', err)
      setError('Gagal memuat daftar pendaftaran kompetisi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [searchParams])

  const handleStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams)
    if (status) {
      next.set('status', status)
    } else {
      next.delete('status')
    }
    setSearchParams(next)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="default">Draf</Badge>
      case 'submitted':
        return <Badge variant="info">Terkirim</Badge>
      case 'under_review':
        return <Badge variant="warning">Sedang Ditinjau</Badge>
      case 'revision_required':
        return <Badge variant="danger">Perlu Revisi</Badge>
      case 'approved':
        return <Badge variant="success">Disetujui</Badge>
      case 'rejected':
        return <Badge variant="danger">Ditolak</Badge>
      case 'cancelled':
        return <Badge variant="default">Dibatalkan</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filterTabs = [
    { label: 'Semua Status', value: '' },
    { label: 'Draf', value: 'draft' },
    { label: 'Menunggu Verifikasi', value: 'submitted' },
    { label: 'Perlu Revisi', value: 'revision_required' },
    { label: 'Disetujui', value: 'approved' },
    { label: 'Ditolak', value: 'rejected' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pendaftaran Kompetisi Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola berkas persyaratan, tinjau catatan panitia, dan pantau status verifikasi lomba.
          </p>
        </div>
        <Link to="/participant/registrations/create">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Daftar Kompetisi Baru
          </Button>
        </Link>
      </div>

      {/* Filter Tabs - Slider on mobile, wrap on desktop */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto sm:flex-wrap no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
              activeStatus === tab.value
                ? 'bg-[var(--color-brand-blue)] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={fetchRegistrations} />
      ) : isLoading ? (
        <CardSkeleton count={3} />
      ) : registrations.length === 0 ? (
        <EmptyState
          title="Tidak Ada Pendaftaran"
          description={
            activeStatus
              ? 'Tidak ditemukan pendaftaran dengan filter status ini.'
              : 'Anda belum mendaftarkan diri pada cabang kompetisi mana pun.'
          }
          action={
            <Link to="/participant/registrations/create">
              <Button variant="primary" size="sm">
                Pilih & Daftar Kompetisi
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const lockedFee = getLockedRegistrationFee(reg)
            return (
            <Card key={reg.id} hoverable className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {reg.registration_number}
                    </span>
                    {getStatusBadge(reg.status)}
                    <Badge variant="secondary">{reg.competition?.category?.name || 'Kompetisi'}</Badge>
                    <Badge variant={reg.team ? 'default' : 'primary'}>
                      <Users className="w-3 h-3 mr-1 inline" />
                      {reg.team ? `Tim: ${reg.team.name}` : 'Individu'}
                    </Badge>
                    {lockedFee === null ? (
                      <Badge variant="warning" size="sm">Biaya Perlu Verifikasi</Badge>
                    ) : lockedFee > 0 ? (
                      <PaymentStatusBadge
                        payment={reg.latest_payment}
                        competitionFee={lockedFee}
                      />
                    ) : (
                      <Badge variant="success" size="sm">Gratis</Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-snug">
                      {reg.competition?.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1">
                      {reg.competition?.short_description}
                    </p>
                  </div>

                  {/* Admin Notes if any */}
                  {reg.admin_notes && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Catatan Panitia:</span> {reg.admin_notes}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Dibuat:{' '}
                        {new Date(reg.created_at || '').toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Dokumen: {reg.documents?.length ?? 0} diunggah
                      </span>
                    </div>

                    <div>
                      Biaya:{' '}
                      <strong className="text-slate-700">
                        {formatRegistrationFee(lockedFee)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center lg:flex-col lg:items-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <Link to={`/participant/registrations/${reg.id}`}>
                    <Button
                      variant={reg.status === 'revision_required' ? 'primary' : 'outline'}
                      size="sm"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      {reg.status === 'draft' || reg.status === 'revision_required'
                        ? 'Kelola Berkas'
                        : 'Detail Pendaftaran'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
