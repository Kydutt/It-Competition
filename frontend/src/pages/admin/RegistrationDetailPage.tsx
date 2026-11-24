import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  FileText,
  User,
  Users,
  Building,
  Mail,
  Phone,
  History,
  FileCheck2,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminRegistration, ActivityLog, AdminRegistrationDocument } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const RegistrationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const registrationId = Number(id)

  const [registration, setRegistration] = useState<AdminRegistration | null>(null)
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean
    targetStatus: 'under_review' | 'approved' | 'revision_required' | 'rejected' | null
    title: string
    note: string
    isSubmitting: boolean
    error: string | null
  }>({
    isOpen: false,
    targetStatus: null,
    title: '',
    note: '',
    isSubmitting: false,
    error: null,
  })

  // Document Verification Modal
  const [docModal, setDocModal] = useState<{
    isOpen: boolean
    doc: AdminRegistrationDocument | null
    status: 'verified' | 'rejected'
    note: string
    isSubmitting: boolean
    error: string | null
  }>({
    isOpen: false,
    doc: null,
    status: 'verified',
    note: '',
    isSubmitting: false,
    error: null,
  })

  const fetchDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getRegistration(registrationId)
      setRegistration(res.data.registration)
      setAuditLogs(res.data.audit_logs || [])
    } catch (err: any) {
      console.error('Failed to load registration detail:', err)
      setError(err.response?.data?.message || 'Gagal memuat detail pendaftaran.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (registrationId) {
      fetchDetail()
    }
  }, [registrationId])

  const openDecisionModal = (
    targetStatus: 'under_review' | 'approved' | 'revision_required' | 'rejected',
    title: string
  ) => {
    setDecisionModal({
      isOpen: true,
      targetStatus,
      title,
      note: '',
      isSubmitting: false,
      error: null,
    })
  }

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!decisionModal.targetStatus) return

    if (
      (decisionModal.targetStatus === 'revision_required' || decisionModal.targetStatus === 'rejected') &&
      !decisionModal.note.trim()
    ) {
      setDecisionModal((prev) => ({
        ...prev,
        error: 'Catatan alasan wajib diisi saat meminta revisi atau menolak pendaftaran.',
      }))
      return
    }

    setDecisionModal((prev) => ({ ...prev, isSubmitting: true, error: null }))
    try {
      await adminService.updateRegistrationStatus(
        registrationId,
        decisionModal.targetStatus,
        decisionModal.note.trim() || undefined
      )
      setDecisionModal({
        isOpen: false,
        targetStatus: null,
        title: '',
        note: '',
        isSubmitting: false,
        error: null,
      })
      await fetchDetail()
    } catch (err: any) {
      console.error('Failed to update registration status:', err)
      setDecisionModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.message || 'Gagal memperbarui status pendaftaran.',
      }))
    }
  }

  const openDocVerification = (doc: AdminRegistrationDocument, status: 'verified' | 'rejected') => {
    setDocModal({
      isOpen: true,
      doc,
      status,
      note: doc.verification_note || '',
      isSubmitting: false,
      error: null,
    })
  }

  const handleDocVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docModal.doc) return

    setDocModal((prev) => ({ ...prev, isSubmitting: true, error: null }))
    try {
      await adminService.verifyDocument(docModal.doc.id, docModal.status, docModal.note.trim() || undefined)
      setDocModal({
        isOpen: false,
        doc: null,
        status: 'verified',
        note: '',
        isSubmitting: false,
        error: null,
      })
      await fetchDetail()
    } catch (err: any) {
      console.error('Failed to verify document:', err)
      setDocModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.message || 'Gagal memperbarui status verifikasi dokumen.',
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 animate-pulse min-w-0">
        <div className="h-6 bg-slate-200 rounded w-36" />
        <div className="h-10 bg-slate-200 rounded w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-64 bg-slate-100 rounded-2xl" />
          </div>
          <div className="h-80 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 min-w-0">
        <Card className="p-6 sm:p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Gagal Memuat Pendaftaran</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">{error}</p>
          <Link to="/admin/registrations">
            <Button variant="outline">Kembali ke Daftar Registrasi</Button>
          </Link>
        </Card>
      </div>
    )
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
        return <Badge variant="secondary">Revision Required</Badge>
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
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/registrations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[var(--color-brand-blue)] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Verifikasi Registrasi</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {registration.registration_number}
            </h1>
            {renderStatusBadge(registration.status)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kompetisi {registration.competition.name} ({registration.competition.category?.name || '-'})
          </p>
        </div>

        {/* Action Decision Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-2">
          {registration.status === 'submitted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDecisionModal('under_review', 'Tandai Sedang Ditinjau (Under Review)')}
              className="gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <Clock className="w-3.5 h-3.5" />
              Mulai Peninjauan
            </Button>
          )}

          {(registration.status === 'submitted' || registration.status === 'under_review') && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openDecisionModal('approved', 'Setujui Pendaftaran Peserta')}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Setujui (Approve)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openDecisionModal('revision_required', 'Minta Revisi Dokumen Persyaratan')}
                className="gap-1.5 text-xs text-purple-700 border-purple-300 hover:bg-purple-50"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Minta Revisi
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openDecisionModal('rejected', 'Tolak Pendaftaran Peserta')}
                className="gap-1.5 text-xs text-red-700 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Tolak
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Details & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registrant / Team Card */}
          <Card className="p-6 space-y-4 border-slate-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              {registration.team ? (
                <>
                  <Users className="w-5 h-5 text-[var(--color-brand-orange)]" />
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Informasi Tim & Anggota</h2>
                </>
              ) : (
                <>
                  <User className="w-5 h-5 text-[var(--color-brand-blue)]" />
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Informasi Peserta Individu</h2>
                </>
              )}
            </div>

            {registration.team ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Nama Tim:</span>
                  <h3 className="text-lg font-black text-slate-900">{registration.team.name}</h3>
                </div>

                {/* Team Members List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Daftar Anggota Tim ({registration.team.members?.length || 1})
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {registration.team.members?.map((member, idx) => {
                      const memberName = member.user?.name || member.name || '-'
                      const memberEmail = member.user?.email || member.email || '-'
                      const rawRole = member.member_role || member.pivot?.member_role || (member.id === registration.team?.leader_id ? 'leader' : 'member')
                      const isLeader = rawRole === 'leader'
                      const institution = member.user?.profile?.institution || member.profile?.institution
                      const phone = member.user?.profile?.phone_number || member.user?.profile?.phone || member.profile?.phone_number || member.profile?.phone

                      return (
                        <div key={member.id || idx} className="p-3.5 bg-white flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{memberName}</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isLeader
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isLeader ? 'Ketua Tim' : 'Anggota'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {memberEmail}
                              </span>
                              {institution && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3 text-slate-400" />
                                  {institution}
                                </span>
                              )}
                              {phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">Nama Lengkap</span>
                  <span className="font-semibold text-slate-900">
                    {registration.user?.name || registration.participant?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Alamat Email</span>
                  <span className="font-semibold text-slate-900">
                    {registration.user?.email || registration.participant?.email || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Institusi / Perguruan Tinggi</span>
                  <span className="font-semibold text-slate-900">
                    {registration.user?.profile?.institution || registration.participant?.profile?.institution || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">No. Telepon / WhatsApp</span>
                  <span className="font-semibold text-slate-900">
                    {registration.user?.profile?.phone_number || registration.user?.profile?.phone || registration.participant?.profile?.phone_number || registration.participant?.profile?.phone || '-'}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Uploaded Documents Table */}
          <Card className="p-6 space-y-4 border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[var(--color-brand-blue)]" />
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Berkas Persyaratan ({registration.documents?.length || 0})
                </h2>
              </div>
            </div>

            {!registration.documents || registration.documents.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada berkas dokumen yang diunggah.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {registration.documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--color-brand-blue)] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{doc.document_type}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              doc.verification_status === 'verified'
                                ? 'bg-emerald-100 text-emerald-700'
                                : doc.verification_status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {doc.verification_status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doc.original_filename} ({(doc.file_size / 1024).toFixed(1)} KB)
                        </p>
                        {doc.verification_note && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1.5 border border-slate-100">
                            <strong>Catatan:</strong> {doc.verification_note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/v1/documents/registration/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocVerification(doc, 'verified')}
                        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 py-1 px-2.5"
                      >
                        Sah
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocVerification(doc, 'rejected')}
                        className="text-xs text-red-700 border-red-300 hover:bg-red-50 py-1 px-2.5"
                      >
                        Tolak
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 col): Verification Status & Audit Logs */}
        <div className="space-y-6">
          {/* Review Summary Card */}
          <Card className="p-5 space-y-4 border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Status & Catatan Admin</h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Status Saat Ini:</span>
                <div className="mt-1">{renderStatusBadge(registration.status)}</div>
              </div>

              {registration.verifier && (
                <div>
                  <span className="text-slate-400 block">Diverifikasi Oleh:</span>
                  <span className="font-semibold text-slate-800">{registration.verifier.name}</span>
                </div>
              )}

              {registration.verified_at && (
                <div>
                  <span className="text-slate-400 block">Waktu Keputusan:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(registration.verified_at).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block">Catatan Panitia / Alasan:</span>
                <p className="mt-1 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed font-mono">
                  {registration.admin_notes || 'Belum ada catatan panitia.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Audit Trail Card */}
          <Card className="p-5 space-y-4 border-slate-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">Riwayat Tindakan (Audit Log)</h3>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Belum ada riwayat audit pendaftaran ini.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono">{log.action}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
                    </div>
                    <p className="font-medium text-slate-800">{log.user?.name || 'Administrator'}</p>
                    {log.new_values?.note && (
                      <p className="text-[11px] text-slate-600 bg-white p-1 rounded border border-slate-100">
                        "{log.new_values.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Decision Modal */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <h3 className="text-lg font-bold text-slate-900">{decisionModal.title}</h3>

            {decisionModal.error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {decisionModal.error}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Panitia / Alasan{' '}
                  {(decisionModal.targetStatus === 'revision_required' || decisionModal.targetStatus === 'rejected') && (
                    <span className="text-red-500">* (Wajib diisi)</span>
                  )}
                </label>
                <textarea
                  value={decisionModal.note}
                  onChange={(e) => setDecisionModal((prev) => ({ ...prev, note: e.target.value }))}
                  rows={4}
                  placeholder="Tuliskan catatan verifikasi atau alasan perbaikan berkas untuk peserta..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={decisionModal.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={decisionModal.isSubmitting}
                  className="w-full sm:w-auto gap-1.5"
                >
                  {decisionModal.isSubmitting ? 'Memproses...' : 'Konfirmasi Keputusan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Verification Modal */}
      {docModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Verifikasi Berkas: {docModal.doc?.original_filename}
            </h3>

            {docModal.error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {docModal.error}
              </div>
            )}

            <form onSubmit={handleDocVerificationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Berkas</label>
                <select
                  value={docModal.status}
                  onChange={(e) => setDocModal((prev) => ({ ...prev, status: e.target.value as any }))}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="verified">Sah / Terverifikasi (Verified)</option>
                  <option value="rejected">Tolak Berkas (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Pemeriksa (Opsional)</label>
                <input
                  type="text"
                  value={docModal.note}
                  onChange={(e) => setDocModal((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Contoh: Berkas sah dan sesuai ketentuan"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDocModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={docModal.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={docModal.isSubmitting} className="w-full sm:w-auto">
                  {docModal.isSubmitting ? 'Menyimpan...' : 'Simpan Verifikasi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
