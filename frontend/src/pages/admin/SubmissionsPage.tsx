import React, { useEffect, useState } from 'react'
import {
  FolderGit2,
  Search,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Code2,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  History,
  FileText,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { publicService } from '../../services/publicService'
import type { AdminSubmission } from '../../types/admin'
import type { Competition } from '../../types/public'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [selectedCompetition, setSelectedCompetition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Detail / Review Modal
  const [activeSubmission, setActiveSubmission] = useState<AdminSubmission | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewStatus, setReviewStatus] = useState<'under_review' | 'accepted' | 'rejected' | 'revision_required'>('under_review')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    publicService.getCompetitions().then((res) => setCompetitions(res.data)).catch(console.error)
  }, [])

  const fetchSubmissions = async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getSubmissions({
        page,
        per_page: 15,
        search: search.trim() || undefined,
        competition_id: selectedCompetition || undefined,
        status: selectedStatus || undefined,
      })

      setSubmissions(res.data.data)
      setCurrentPage(res.data.current_page)
      setTotalPages(res.data.last_page)
      setTotalCount(res.data.total)
    } catch (err: any) {
      console.error('Failed to load submissions:', err)
      setError(err.response?.data?.message || 'Gagal memuat submisi karya.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions(1)
  }, [selectedCompetition, selectedStatus])

  const isActionable = (status: string) => status === 'submitted' || status === 'under_review'

  const getValidTransitions = (status: string): { value: 'under_review' | 'accepted' | 'revision_required' | 'rejected'; label: string }[] => {
    if (status === 'submitted') {
      return [
        { value: 'under_review', label: 'Under Review (Mulai Diperiksa)' },
        { value: 'accepted', label: 'Accepted (Terima / Setujui Karya)' },
        { value: 'revision_required', label: 'Revision Required (Minta Revisi Peserta)' },
        { value: 'rejected', label: 'Rejected (Tolak Karya)' },
      ]
    }
    if (status === 'under_review') {
      return [
        { value: 'accepted', label: 'Accepted (Terima / Setujui Karya)' },
        { value: 'revision_required', label: 'Revision Required (Minta Revisi Peserta)' },
        { value: 'rejected', label: 'Rejected (Tolak Karya)' },
      ]
    }
    return []
  }

  const openReviewModal = (sub: AdminSubmission) => {
    setActiveSubmission(sub)
    const valid = getValidTransitions(sub.status)
    if (valid.length > 0) {
      setReviewStatus(valid[0].value)
    }
    setReviewNotes(sub.review_note || sub.admin_notes || '')
    setReviewError(null)
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSubmission) return

    const trimmedNotes = reviewNotes.trim()

    if ((reviewStatus === 'revision_required' || reviewStatus === 'rejected') && !trimmedNotes) {
      setReviewError('Catatan panitia wajib diisi saat meminta revisi atau menolak karya.')
      return
    }

    setIsReviewing(true)
    setReviewError(null)
    try {
      const res = await adminService.reviewSubmission(activeSubmission.id, reviewStatus, trimmedNotes || undefined)
      setFeedbackMessage({
        type: 'success',
        text: res.message || `Status karya "${activeSubmission.title}" berhasil diperbarui.`,
      })
      setIsReviewModalOpen(false)
      setActiveSubmission(null)
      await fetchSubmissions(currentPage)
    } catch (err: any) {
      console.error('Failed to review submission:', err)
      const errorMsg =
        err.response?.data?.errors?.notes?.[0] ||
        err.response?.data?.errors?.status?.[0] ||
        err.response?.data?.message ||
        'Gagal meninjau karya.'
      setReviewError(errorMsg)
    } finally {
      setIsReviewing(false)
    }
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const blob = await adminService.exportSubmissionsCsv({
        competition_id: selectedCompetition || undefined,
        status: selectedStatus || undefined,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `submissions_export_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export CSV:', err)
      setFeedbackMessage({
        type: 'error',
        text: 'Gagal mengekspor data CSV submisi karya.',
      })
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
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>
      case 'revision_required':
        return <Badge variant="secondary">Revision Required</Badge>
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Submisi Karya Peserta</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tinjau berkas karya lomba, repositori kode, tautan demo, dan histori revisi.
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
          <Button variant="outline" size="sm" onClick={() => fetchSubmissions(currentPage)} className="flex-1 sm:flex-none gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl flex items-start justify-between gap-3 text-xs sm:text-sm border shadow-2xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-3.5 sm:p-4 border-slate-200 min-w-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            fetchSubmissions(1)
          }}
          className="flex flex-col lg:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul karya, no. registrasi, pendaftar..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
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
              className="w-full lg:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted (Diterima)</option>
              <option value="revision_required">Revision Required</option>
              <option value="rejected">Rejected</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto text-xs">
              Cari
            </Button>
          </div>
        </form>
      </Card>

      {/* Submissions Table */}
      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat submisi karya...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Karya Masuk</h3>
            <p className="text-xs text-slate-500">Belum ada peserta yang mengumpulkan karya lomba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Judul Karya</th>
                  <th className="py-3 px-4">Pendaftar / Tim</th>
                  <th className="py-3 px-4">Kompetisi</th>
                  <th className="py-3 px-4">Tautan Berkas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal Pengumpulan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                      <div>
                        <span className="line-clamp-1">{sub.title}</span>
                        {sub.description && (
                          <span className="text-[11px] text-slate-400 font-normal line-clamp-1 block">
                            {sub.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">
                        {sub.registration?.team ? sub.registration.team.name : sub.registration?.user?.name || '-'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {sub.registration?.registration_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800">{sub.registration?.competition?.name || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {sub.repository_url && (
                          <a
                            href={sub.repository_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Repositori Kode"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {sub.external_url && (
                          <a
                            href={sub.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-[var(--color-brand-blue)]"
                            title="Demo / Tautan Eksternal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {sub.file_path && (
                          <a
                            href={`/api/v1/documents/submission/${sub.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            title="Unduh Berkas Karya"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{renderStatusBadge(sub.status)}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewModal(sub)}
                        className="gap-1 py-1 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isActionable(sub.status) ? 'Tinjau' : 'Lihat Detail'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Hal. {currentPage} dari {totalPages} ({totalCount} data)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSubmissions(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSubmissions(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Review & Detail Modal */}
      {isReviewModalOpen && activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-2">
                {isActionable(activeSubmission.status) ? 'Tinjau Karya' : 'Detail Peninjauan Karya'}
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notification */}
            {reviewError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Submission Info Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{activeSubmission.title}</span>
                  <span className="text-slate-500 text-[11px] block">{activeSubmission.registration?.competition?.name || '-'}</span>
                </div>
                <div>{renderStatusBadge(activeSubmission.status)}</div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Pendaftar / Tim:</span>
                <span className="font-semibold text-slate-800">
                  {activeSubmission.registration?.team
                    ? activeSubmission.registration.team.name
                    : activeSubmission.registration?.user?.name || '-'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                  ({activeSubmission.registration?.registration_number})
                </span>
              </div>

              {activeSubmission.description && (
                <div className="pt-1">
                  <span className="text-slate-400 block text-[11px]">Deskripsi Singkat Karya:</span>
                  <p className="text-slate-700 leading-relaxed">{activeSubmission.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                {activeSubmission.repository_url && (
                  <a
                    href={activeSubmission.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--color-brand-blue)] hover:underline font-semibold"
                  >
                    <Code2 className="w-3.5 h-3.5" /> Repositori Kode
                  </a>
                )}
                {activeSubmission.external_url && (
                  <a
                    href={activeSubmission.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--color-brand-blue)] hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Demo Aplikasi
                  </a>
                )}
                {activeSubmission.file_path && (
                  <a
                    href={`/api/v1/documents/submission/${activeSubmission.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Berkas
                  </a>
                )}
              </div>
            </div>

            {/* Non-actionable State: revision_required */}
            {activeSubmission.status === 'revision_required' && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Menunggu Pengiriman Revisi dari Peserta</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Karya ini saat ini sedang dalam proses perbaikan oleh peserta. Panitia tidak dapat mengubah status atau menolak karya secara sepihak sampai peserta mengirimkan berkas/tautan revisi terbaru.
                </p>
                {(activeSubmission.review_note || activeSubmission.admin_notes) && (
                  <div className="mt-2 pt-2 border-t border-amber-200/60 text-xs">
                    <span className="font-semibold text-amber-950 block mb-1">Catatan revisi yang dikirimkan ke peserta:</span>
                    <p className="text-amber-900 italic bg-white/70 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                      "{activeSubmission.review_note || activeSubmission.admin_notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Non-actionable State: accepted */}
            {activeSubmission.status === 'accepted' && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Karya Diterima (Approved)</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  Karya telah disetujui oleh panitia dan memenuhi standar kompetisi. Keputusan peninjauan ini bersifat final.
                </p>
                {(activeSubmission.review_note || activeSubmission.admin_notes) && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 text-xs">
                    <span className="font-semibold text-emerald-950 block mb-1">Catatan persetujuan:</span>
                    <p className="text-emerald-900 italic bg-white/70 p-2.5 rounded-lg border border-emerald-200/60 leading-relaxed">
                      "{activeSubmission.review_note || activeSubmission.admin_notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Non-actionable State: rejected */}
            {activeSubmission.status === 'rejected' && (
              <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-950">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Karya Ditolak (Rejected)</span>
                </div>
                <p className="text-red-800 leading-relaxed">
                  Karya telah ditolak oleh panitia. Keputusan peninjauan ini bersifat final.
                </p>
                {(activeSubmission.review_note || activeSubmission.admin_notes) && (
                  <div className="mt-2 pt-2 border-t border-red-200/60 text-xs">
                    <span className="font-semibold text-red-950 block mb-1">Catatan alasan penolakan:</span>
                    <p className="text-red-900 italic bg-white/70 p-2.5 rounded-lg border border-red-200/60 leading-relaxed">
                      "{activeSubmission.review_note || activeSubmission.admin_notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Riwayat Revisi (Revision History) */}
            {activeSubmission.revisions && activeSubmission.revisions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Riwayat Versi Karya ({activeSubmission.revisions.length} versi lampau)</span>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {activeSubmission.revisions.map((rev, idx) => (
                    <div key={rev.id || idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-slate-800">Versi #{idx + 1}</span>
                        <span>{new Date(rev.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {rev.revision_note && (
                        <p className="text-slate-600 italic">"{rev.revision_note}"</p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        {rev.external_url && (
                          <a href={rev.external_url} target="_blank" rel="noreferrer" className="text-[var(--color-brand-blue)] hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Tautan demo
                          </a>
                        )}
                        {rev.file_path && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Berkas arsip
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Form (submitted or under_review) */}
            {isActionable(activeSubmission.status) ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs sm:text-sm pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keputusan Status Peninjauan *
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {getValidTransitions(activeSubmission.status).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Panitia{' '}
                    {(reviewStatus === 'revision_required' || reviewStatus === 'rejected') ? (
                      <span className="text-red-500 font-bold">* (Wajib diisi)</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(Opsional)</span>
                    )}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder={
                      reviewStatus === 'revision_required'
                        ? 'Jelaskan poin perbaikan yang harus diperbaiki oleh peserta...'
                        : reviewStatus === 'rejected'
                        ? 'Jelaskan alasan penolakan karya secara objektif...'
                        : 'Catatan hasil peninjauan karya untuk peserta...'
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReviewModalOpen(false)}
                    disabled={isReviewing}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isReviewing} className="w-full sm:w-auto font-bold">
                    {isReviewing ? 'Menyimpan...' : 'Simpan Peninjauan'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Tutup
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
