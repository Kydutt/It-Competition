import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Trophy,
  Swords,
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  FolderGit2,
  History,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminDashboardData } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getDashboard()
      setData(res.data)
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err)
      setError(err.response?.data?.message || 'Gagal memuat data dashboard operasional.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-9 bg-slate-200 rounded w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 min-w-0">
        <Card className="p-6 sm:p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Gagal Mengambil Data</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">{error}</p>
          <Button variant="primary" onClick={fetchDashboard}>
            Coba Lagi
          </Button>
        </Card>
      </div>
    )
  }

  const { overview, registrations_by_status, submissions_by_status, recent_activity_logs } = data

  const pendingVerification =
    (registrations_by_status['submitted'] || 0) + (registrations_by_status['under_review'] || 0)

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Dashboard Operasional</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan metrik partisipasi, verifikasi berkas, dan aktivitas sistem.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboard} className="flex-1 sm:flex-none gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            Segarkan
          </Button>
          <Link to="/admin/registrations" className="flex-1 sm:flex-none">
            <Button variant="primary" size="sm" className="w-full gap-1.5 text-xs font-semibold">
              <ClipboardList className="w-3.5 h-3.5" />
              Verifikasi Masuk ({pendingVerification})
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[var(--color-brand-blue)] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Peserta</span>
            <span className="text-2xl font-black text-slate-900">{overview.total_participants}</span>
            <span className="text-[11px] text-slate-500 block">Akun terdaftar</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[var(--color-brand-orange)] flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Tim</span>
            <span className="text-2xl font-black text-slate-900">{overview.total_teams}</span>
            <span className="text-[11px] text-slate-500 block">Terbentuk di platform</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Cabang Kompetisi</span>
            <span className="text-2xl font-black text-slate-900">{overview.total_competitions}</span>
            <span className="text-[11px] text-slate-500 block">Dalam {overview.total_events} perhelatan</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pendaftaran Masuk</span>
            <span className="text-2xl font-black text-slate-900">{overview.total_registrations}</span>
            <span className="text-[11px] text-slate-500 block">Total seluruh cabang</span>
          </div>
        </Card>
      </div>

      {/* Registration & Submission Status Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Verification Statuses */}
        <Card className="p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[var(--color-brand-blue)]" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Status Pendaftaran Peserta</h2>
            </div>
            <Link to="/admin/registrations" className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline flex items-center gap-1">
              Semua Pendaftaran <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/80">
              <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium mb-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted
              </div>
              <span className="text-xl font-black text-blue-900">{registrations_by_status['submitted'] || 0}</span>
              <p className="text-[10px] text-blue-600 mt-0.5">Menunggu peninjauan</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100/80">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium mb-1">
                <Clock className="w-3.5 h-3.5" />
                Under Review
              </div>
              <span className="text-xl font-black text-amber-900">{registrations_by_status['under_review'] || 0}</span>
              <p className="text-[10px] text-amber-600 mt-0.5">Sedang diverifikasi</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved
              </div>
              <span className="text-xl font-black text-emerald-900">{registrations_by_status['approved'] || 0}</span>
              <p className="text-[10px] text-emerald-600 mt-0.5">Lolos verifikasi berkas</p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100/80">
              <div className="flex items-center gap-1.5 text-purple-700 text-xs font-medium mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Revision
              </div>
              <span className="text-xl font-black text-purple-900">{registrations_by_status['revision_required'] || 0}</span>
              <p className="text-[10px] text-purple-600 mt-0.5">Perlu perbaikan berkas</p>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100/80">
              <div className="flex items-center gap-1.5 text-red-700 text-xs font-medium mb-1">
                <XCircle className="w-3.5 h-3.5" />
                Rejected
              </div>
              <span className="text-xl font-black text-red-900">{registrations_by_status['rejected'] || 0}</span>
              <p className="text-[10px] text-red-600 mt-0.5">Ditolak / tidak lolos</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium mb-1">
                <FileText className="w-3.5 h-3.5" />
                Draft
              </div>
              <span className="text-xl font-black text-slate-800">{registrations_by_status['draft'] || 0}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Belum disubmit final</p>
            </div>
          </div>
        </Card>

        {/* Submissions Overview */}
        <Card className="p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-[var(--color-brand-orange)]" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Pengumpulan Karya Lomba</h2>
            </div>
            <Link to="/admin/submissions" className="text-xs font-semibold text-[var(--color-brand-orange)] hover:underline flex items-center gap-1">
              Semua Karya <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/80">
              <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium mb-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted
              </div>
              <span className="text-xl font-black text-blue-900">{submissions_by_status['submitted'] || 0}</span>
              <p className="text-[10px] text-blue-600 mt-0.5">Karya masuk</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100/80">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium mb-1">
                <Clock className="w-3.5 h-3.5" />
                Under Review
              </div>
              <span className="text-xl font-black text-amber-900">{submissions_by_status['under_review'] || 0}</span>
              <p className="text-[10px] text-amber-600 mt-0.5">Peninjauan karya</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accepted
              </div>
              <span className="text-xl font-black text-emerald-900">{submissions_by_status['accepted'] || 0}</span>
              <p className="text-[10px] text-emerald-600 mt-0.5">Karya diterima panitia</p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100/80">
              <div className="flex items-center gap-1.5 text-purple-700 text-xs font-medium mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Revision
              </div>
              <span className="text-xl font-black text-purple-900">{submissions_by_status['revision_required'] || 0}</span>
              <p className="text-[10px] text-purple-600 mt-0.5">Revisi diminta panitia</p>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100/80">
              <div className="flex items-center gap-1.5 text-red-700 text-xs font-medium mb-1">
                <XCircle className="w-3.5 h-3.5" />
                Rejected
              </div>
              <span className="text-xl font-black text-red-900">{submissions_by_status['rejected'] || 0}</span>
              <p className="text-[10px] text-red-600 mt-0.5">Karya ditolak</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Administrative Activity Log */}
      <Card className="p-4 sm:p-6 space-y-4 min-w-0 overflow-hidden border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Audit Trail Tindakan Terkini</h2>
          </div>
          <Link to="/admin/activity-logs" className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline flex items-center gap-1">
            Lihat Semua Log <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent_activity_logs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat aktivitas log administratif.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Pelaksana</th>
                  <th className="py-2.5 px-3">Tindakan</th>
                  <th className="py-2.5 px-3">Entitas</th>
                  <th className="py-2.5 px-3">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recent_activity_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-900">{log.user?.name || 'Sistem'}</span>
                      <span className="text-[10px] text-slate-400 block">{log.user?.email}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{log.entity_type}</span>
                      <span className="text-slate-400 ml-1">#{log.entity_id}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
