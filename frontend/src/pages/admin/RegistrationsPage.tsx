import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Search,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { publicService } from '../../services/publicService'
import type { AdminRegistration } from '../../types/admin'
import type { Competition } from '../../types/public'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [selectedCompetition, setSelectedCompetition] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Load competitions for filter dropdown
  useEffect(() => {
    publicService.getCompetitions().then((res) => {
      setCompetitions(res.data)
    }).catch(console.error)
  }, [])

  const fetchRegistrations = async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getRegistrations({
        page,
        per_page: 15,
        search: search.trim() || undefined,
        competition_id: selectedCompetition || undefined,
        status: selectedStatus || undefined,
      })

      setRegistrations(res.data.data)
      setCurrentPage(res.data.current_page)
      setTotalPages(res.data.last_page)
      setTotalCount(res.data.total)
    } catch (err: any) {
      console.error('Failed to load registrations:', err)
      setError(err.response?.data?.message || 'Gagal mengambil data pendaftaran.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations(1)
  }, [selectedCompetition, selectedStatus])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRegistrations(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCompetition('')
    setSelectedStatus('')
    // will trigger useEffect
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const blob = await adminService.exportRegistrationsCsv({
        competition_id: selectedCompetition || undefined,
        status: selectedStatus || undefined,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations_export_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to export CSV:', err)
      alert('Gagal mengekspor data ke CSV.')
    } finally {
      setIsExporting(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="primary">Submitted</Badge>
      case 'under_review':
        return <Badge variant="warning">Under Review</Badge>
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'revision_required':
        return <Badge variant="secondary">Revision</Badge>
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>
      case 'cancelled':
        return <Badge variant="default">Cancelled</Badge>
      case 'draft':
      default:
        return <Badge variant="default">Draft</Badge>
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Verifikasi Registrasi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola pendaftaran masuk, verifikasi berkas persyaratan, dan tetapkan status keputusan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex-1 sm:flex-none gap-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Mengekspor...' : 'Ekspor CSV'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRegistrations(currentPage)}
            className="flex-1 sm:flex-none gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5 sm:p-4 border-slate-200 min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. registrasi, nama peserta, email, atau nama tim..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
            >
              <option value="">Semua Kompetisi</option>
              {competitions.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
            >
              <option value="">Semua Status</option>
              <option value="submitted">Submitted (Menunggu)</option>
              <option value="under_review">Under Review (Sedang Diperiksa)</option>
              <option value="approved">Approved (Disetujui)</option>
              <option value="revision_required">Revision Required (Revisi)</option>
              <option value="rejected">Rejected (Ditolak)</option>
              <option value="draft">Draft (Draf)</option>
              <option value="cancelled">Cancelled (Dibatalkan)</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto text-xs">
              Cari
            </Button>

            {(search || selectedCompetition || selectedStatus) && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="w-full sm:w-auto text-xs">
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Registrations List Table */}
      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat data pendaftaran...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchRegistrations(1)}>
              Coba Lagi
            </Button>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Tidak Ada Pendaftaran Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada pendaftaran yang cocok dengan kriteria pencarian atau filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Registrasi</th>
                  <th className="py-3 px-4">Pendaftar / Tim</th>
                  <th className="py-3 px-4">Kompetisi</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu Submit</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--color-brand-blue)]">
                      <Link to={`/admin/registrations/${reg.id}`} className="hover:underline">
                        {reg.registration_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      {reg.team ? (
                        <div>
                          <span className="font-semibold text-slate-900 block flex items-center gap-1">
                            <Users className="w-3 h-3 text-[var(--color-brand-orange)]" />
                            {reg.team.name}
                          </span>
                          <span className="text-[11px] text-slate-400">Ketua: {reg.user?.name}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-900 block">{reg.user?.name}</span>
                          <span className="text-[11px] text-slate-400">{reg.user?.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{reg.competition.name}</span>
                      <span className="text-[11px] text-slate-400">{reg.competition.category?.name || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-600">
                        {reg.team ? 'Tim' : 'Individu'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(reg.status)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {reg.submitted_at
                        ? new Date(reg.submitted_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/admin/registrations/${reg.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 py-1 px-2.5 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Periksa</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Menampilkan hal. {currentPage} dari {totalPages} ({totalCount} data)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRegistrations(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRegistrations(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
