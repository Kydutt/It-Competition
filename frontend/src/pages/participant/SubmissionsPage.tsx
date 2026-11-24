import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  ExternalLink,
  Code2,
  CheckCircle2,
  History,
  Send,
  PlusCircle,
  RotateCcw,
} from 'lucide-react'
import { participantService } from '../../services/participantService'
import type { Submission, Registration } from '../../types/participant'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'

export const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [approvedRegistrations, setApprovedRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedRegId, setSelectedRegId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [workFile, setWorkFile] = useState<File | null>(null)
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Revision modal state
  const [revisionSubmission, setRevisionSubmission] = useState<Submission | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [revisionFile, setRevisionFile] = useState<File | null>(null)
  const [revisionExternalUrl, setRevisionExternalUrl] = useState('')
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [subRes, regRes] = await Promise.all([
        participantService.getSubmissions(),
        participantService.getRegistrations({ status: 'approved' }),
      ])
      setSubmissions(subRes.data || [])
      setApprovedRegistrations(regRes.data || [])
    } catch (err) {
      console.error('Failed to load submissions:', err)
      setError('Gagal memuat daftar submisi karya.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!selectedRegId) {
      setModalError('Harap pilih pendaftaran kompetisi.')
      return
    }

    if (!title.trim()) {
      setModalError('Judul karya wajib diisi.')
      return
    }

    const formData = new FormData()
    formData.append('registration_id', selectedRegId.toString())
    formData.append('title', title.trim())
    if (description.trim()) formData.append('description', description.trim())
    if (workFile) formData.append('file', workFile)
    if (repositoryUrl.trim()) formData.append('repository_url', repositoryUrl.trim())
    if (externalUrl.trim()) formData.append('external_url', externalUrl.trim())

    setIsSubmitting(true)
    try {
      await participantService.submitWork(formData)
      setShowSubmitModal(false)
      setTitle('')
      setDescription('')
      setWorkFile(null)
      setRepositoryUrl('')
      setExternalUrl('')
      await fetchData()
    } catch (err: any) {
      console.error('Failed to submit work:', err)
      setModalError(err.response?.data?.message || 'Gagal mengirimkan karya.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!revisionSubmission) return

    const formData = new FormData()
    if (revisionFile) formData.append('file', revisionFile)
    if (revisionExternalUrl.trim()) formData.append('external_url', revisionExternalUrl.trim())
    if (revisionNotes.trim()) formData.append('notes', revisionNotes.trim())

    setIsSubmittingRevision(true)
    try {
      await participantService.submitRevision(revisionSubmission.id, formData)
      setRevisionSubmission(null)
      setRevisionNotes('')
      setRevisionFile(null)
      setRevisionExternalUrl('')
      await fetchData()
    } catch (err: any) {
      console.error('Failed to submit revision:', err)
      alert(err.response?.data?.message || 'Gagal mengirimkan revisi.')
    } finally {
      setIsSubmittingRevision(false)
    }
  }

  const getSubmissionBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="info">Terkirim</Badge>
      case 'under_review':
        return <Badge variant="warning">Dalam Peninjauan</Badge>
      case 'revision_required':
        return <Badge variant="danger">Perlu Revisi</Badge>
      case 'accepted':
        return <Badge variant="success">Diterima</Badge>
      case 'rejected':
        return <Badge variant="danger">Ditolak</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Filter approved registrations that don't have a submission yet
  const unsubmittedRegistrations = approvedRegistrations.filter(
    (reg) => !submissions.some((s) => s.registration_id === reg.id)
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengumpulan Karya (Submission)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kumpulkan berkas proposal, link repository, dan demo produk untuk pendaftaran yang telah diverifikasi.
          </p>
        </div>
        {unsubmittedRegistrations.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedRegId(unsubmittedRegistrations[0].id)
              setShowSubmitModal(true)
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Kumpulkan Karya Baru
          </Button>
        )}
      </div>

      {/* Eligible Competitions Alert Banner */}
      {unsubmittedRegistrations.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Anda memiliki {unsubmittedRegistrations.length} pendaftaran yang siap dikumpulkan karyanya!
              </p>
              <p className="text-xs text-blue-800 mt-0.5">
                Pastikan karya telah memenuhi format dan kriteria buku panduan sebelum batas akhir.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedRegId(unsubmittedRegistrations[0].id)
              setShowSubmitModal(true)
            }}
          >
            Kumpulkan Sekarang
          </Button>
        </div>
      )}

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : isLoading ? (
        <CardSkeleton count={2} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="Belum Ada Karya yang Dikumpulkan"
          description={
            approvedRegistrations.length > 0
              ? 'Anda memiliki pendaftaran yang telah disetujui. Silakan klik tombol di bawah untuk mengumpulkan karya Anda.'
              : 'Pengumpulan karya hanya dapat dilakukan setelah berkas pendaftaran Anda disetujui oleh panitia.'
          }
          action={
            unsubmittedRegistrations.length > 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedRegId(unsubmittedRegistrations[0].id)
                  setShowSubmitModal(true)
                }}
              >
                Kumpulkan Karya
              </Button>
            ) : (
              <Link to="/participant/registrations">
                <Button variant="outline" size="sm">
                  Cek Status Pendaftaran
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => (
            <Card key={sub.id} className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {sub.registration_number || 'SUBMISSION'}
                    </span>
                    {getSubmissionBadge(sub.status)}
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900">{sub.title}</h3>
                  <p className="text-xs text-slate-500">
                    Cabang Lomba: <span className="font-semibold text-slate-700">{sub.competition_name}</span>
                  </p>
                </div>

                {sub.status === 'revision_required' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setRevisionSubmission(sub)
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Kirimkan Revisi
                  </Button>
                )}
              </div>

              {sub.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {sub.description}
                </p>
              )}

              {/* Review Note if any */}
              {sub.review_note && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <p className="font-bold">Catatan Peninjauan Panitia:</p>
                  <p className="leading-relaxed">{sub.review_note}</p>
                </div>
              )}

              {/* Links & Attachments */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100 text-slate-600">
                {sub.file_url && (
                  <a
                    href={sub.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-brand-blue)] hover:underline font-semibold"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Unduh Berkas Karya</span>
                  </a>
                )}
                {sub.repository_url && (
                  <a
                    href={sub.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-800 hover:underline font-semibold"
                  >
                    <Code2 className="w-4 h-4 text-slate-700" />
                    <span>Repository Kode</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
                {sub.external_url && (
                  <a
                    href={sub.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-brand-orange-dark)] hover:underline font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Demo / Prototype Eksternal</span>
                  </a>
                )}
              </div>

              {/* Revision History */}
              {sub.revisions && sub.revisions.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Riwayat Revisi ({sub.revisions.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {sub.revisions.map((rev) => (
                      <div key={rev.id} className="p-2.5 rounded-lg bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span>Revisi Diserahkan</span>
                          <span>
                            {rev.submitted_at
                              ? new Date(rev.submitted_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </span>
                        </div>
                        <p className="text-slate-700">{rev.revision_note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Submit Work Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Kumpulkan Karya Kompetisi</h3>
            <p className="text-xs text-slate-500">
              Isi formulir di bawah ini dengan tautan atau berkas karya yang telah Anda selesaikan.
            </p>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Pendaftaran Terkait</label>
                <select
                  value={selectedRegId || ''}
                  onChange={(e) => setSelectedRegId(parseInt(e.target.value, 10))}
                  required
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                >
                  {unsubmittedRegistrations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.registration_number} - {r.competition?.name} ({r.team ? r.team.name : 'Individu'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Judul Karya / Proyek <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Sistem Informasi Pencegah Bencana Berbasis AI"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Deskripsi Ringkas Karya</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan ringkasan solusi, teknologi yang dipakai, dan keunggulan produk Anda..."
                  rows={3}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Berkas Karya (PDF / ZIP maks 25MB)</label>
                <input
                  type="file"
                  accept=".pdf,.zip,.rar,.tar,.gz"
                  onChange={(e) => setWorkFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[var(--color-brand-orange-dark)] hover:file:bg-orange-100 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tautan Repository (GitHub/GitLab)</label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tautan Demo / Prototype (Figma / Web Live)</label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://figma.com/... atau https://demo.domain.com"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Kirimkan Karya
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Kirimkan Revisi Karya</h3>
            <p className="text-xs text-slate-500">
              Unggah berkas perbaikan atau perbarui tautan demo sesuai catatan yang diberikan panitia.
            </p>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Catatan Perbaikan dari Peserta</label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Tuliskan perubahan apa saja yang telah Anda perbaiki..."
                  required
                  rows={3}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Berkas Revisi Baru (Opsional)</label>
                <input
                  type="file"
                  accept=".pdf,.zip,.rar"
                  onChange={(e) => setRevisionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[var(--color-brand-orange-dark)] hover:file:bg-orange-100 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tautan Baru (Opsional)</label>
                <input
                  type="url"
                  value={revisionExternalUrl}
                  onChange={(e) => setRevisionExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevisionSubmission(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingRevision}
                >
                  Kirim Revisi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
