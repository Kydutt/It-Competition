import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  ArrowRight,
  PlusCircle,
  Users,
  Bell,
} from 'lucide-react'
import { participantService } from '../../services/participantService'
import type { DashboardData } from '../../types/participant'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../context/AuthContext'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await participantService.getDashboard()
      setData(res.data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Gagal memuat ringkasan dashboard peserta.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-slate-200 animate-pulse rounded" />
        <CardSkeleton count={4} />
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState message={error || 'Data dashboard tidak tersedia.'} onRetry={loadDashboard} />
  }

  const { status_counts } = data

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau status pendaftaran, kelola anggota tim, dan kumpulkan karya kompetisi Anda.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/participant/registrations/create">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Daftar Kompetisi Baru
            </Button>
          </Link>
          <Link to="/participant/teams">
            <Button variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Kelola Tim
            </Button>
          </Link>
        </div>
      </div>

      {/* Revision Required Alert Banner */}
      {status_counts.revision_required > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Ada Berkas Pendaftaran yang Membutuhkan Revisi!</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Terdapat {status_counts.revision_required} pendaftaran dengan permintaan perbaikan dari panitia. Silakan periksa catatan dan unggah berkas yang diminta.
            </p>
          </div>
          <Link to="/participant/registrations?status=revision_required">
            <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              Lihat Revisi
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Pendaftaran
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {status_counts.total}
          </div>
          <span className="text-[11px] text-slate-400">Seluruh cabang lomba</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Disetujui
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {status_counts.approved}
          </div>
          <span className="text-[11px] text-slate-400">Siap submit karya</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menunggu Verifikasi
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {status_counts.submitted + status_counts.under_review}
          </div>
          <span className="text-[11px] text-slate-400">Dalam tinjauan panitia</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Draf Belum Dikirim
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-700">
            {status_counts.draft}
          </div>
          <span className="text-[11px] text-slate-400">Belum disubmit</span>
        </Card>
      </div>

      {/* Main Grid: Registrations & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Recent Registrations */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[var(--color-brand-blue)]" />
                <h3 className="font-bold text-base text-slate-900">Pendaftaran Terbaru</h3>
              </div>
              <Link
                to="/participant/registrations"
                className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline inline-flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.recent_registrations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm space-y-3">
                <p>Anda belum memiliki pendaftaran kompetisi aktif.</p>
                <Link to="/participant/registrations/create">
                  <Button variant="primary" size="sm">
                    Daftar Kompetisi Sekarang
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recent_registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {reg.registration_number}
                        </span>
                        {getStatusBadge(reg.status)}
                      </div>
                      <h4 className="font-bold text-slate-900">
                        {reg.competition?.name || 'Kompetisi'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {reg.team ? `Tim: ${reg.team.name}` : 'Individu'} •{' '}
                        {reg.submitted_at
                          ? `Disubmit: ${new Date(reg.submitted_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}`
                          : 'Draf'}
                      </p>
                    </div>

                    <Link to={`/participant/registrations/${reg.id}`}>
                      <Button variant="outline" size="sm">
                        Kelola
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Announcements Card */}
          {data.announcements.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Pengumuman Terkait</h3>
                <Link to="/announcements" className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline">
                  Lihat Publikasi
                </Link>
              </div>
              <div className="space-y-3">
                {data.announcements.map((ann) => (
                  <div key={ann.id} className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      {new Date(ann.published_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <Link
                      to={`/announcements/${ann.slug}`}
                      className="font-bold text-sm text-slate-800 hover:text-[var(--color-brand-blue)] line-clamp-1"
                    >
                      {ann.title}
                    </Link>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ann.excerpt}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (4 cols): Deadlines & Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Deadlines Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-[var(--color-brand-orange)]" />
              <span>Batas Waktu Terdekat</span>
            </div>
            {data.upcoming_deadlines.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Tidak ada batas waktu mendesak saat ini.
              </p>
            ) : (
              <div className="space-y-3">
                {data.upcoming_deadlines.map((dl, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-orange-50/50 border border-orange-100 space-y-1 text-xs">
                    <span className="font-bold text-slate-800 block truncate">
                      {dl.competition_name}
                    </span>
                    {dl.submission_deadline ? (
                      <div className="text-slate-600">
                        <span className="text-slate-400">Batas Karya:</span>{' '}
                        <span className="font-semibold text-red-600">
                          {new Date(dl.submission_deadline).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : dl.registration_deadline ? (
                      <div className="text-slate-600">
                        <span className="text-slate-400">Batas Registrasi:</span>{' '}
                        <span className="font-semibold text-slate-800">
                          {new Date(dl.registration_deadline).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Notifications Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Bell className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <span>Notifikasi</span>
              </div>
              <Link
                to="/participant/notifications"
                className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            {data.notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada notifikasi baru.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {data.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border ${
                      notif.is_read
                        ? 'bg-white border-slate-200 text-slate-600'
                        : 'bg-blue-50/50 border-blue-100 text-slate-900 font-medium'
                    }`}
                  >
                    <p className="font-bold leading-snug">{notif.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(notif.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
