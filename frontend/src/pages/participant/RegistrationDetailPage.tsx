import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Users,
  AlertCircle,
  FileCheck,
  Upload,
  Download,
  ArrowLeft,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { participantService } from '../../services/participantService'
import { useAuth } from '../../context/AuthContext'
import { formatRegistrationFee, getLockedRegistrationFee } from '../../utils/currency'
import type { Registration } from '../../types/participant'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { RegistrationPaymentPanel } from '../../components/payments/RegistrationPaymentPanel'

export const RegistrationDetailPage: React.FC = () => {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const registrationId = parseInt(id || '0', 10)

  const [registration, setRegistration] = useState<Registration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Document upload state
  const [docType, setDocType] = useState('ktm')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Submission state
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const fetchDetail = async () => {
    if (!registrationId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await participantService.getRegistration(registrationId)
      setRegistration(res.data)
    } catch (err) {
      console.error('Failed to load registration:', err)
      setError('Pendaftaran tidak ditemukan atau Anda tidak memiliki akses.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [registrationId])

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)
    setUploadSuccess(null)

    if (!selectedFile) {
      setUploadError('Harap pilih berkas dokumen yang ingin diunggah.')
      return
    }

    const formData = new FormData()
    formData.append('document_type', docType)
    formData.append('file', selectedFile)

    setIsUploading(true)
    try {
      await participantService.uploadDocument(registrationId, formData)
      setUploadSuccess('Berkas persyaratan berhasil diunggah.')
      setSelectedFile(null)
      await fetchDetail()
    } catch (err: any) {
      console.error('Failed to upload document:', err)
      setUploadError(
        err.response?.data?.errors?.file?.[0] ||
        err.response?.data?.message ||
        'Gagal mengunggah berkas dokumen.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmitFinal = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mengirimkan pendaftaran ini? Setelah dikirim, data tidak dapat diubah kembali kecuali diminta revisi oleh panitia.')) {
      return
    }

    setUploadError(null)
    setIsSubmittingFinal(true)
    try {
      await participantService.submitRegistration(registrationId)
      setSubmitSuccess('Pendaftaran Anda telah berhasil dikirimkan! Panitia akan segera melakukan verifikasi.')
      await fetchDetail()
    } catch (err: any) {
      console.error('Failed to submit registration:', err)
      const msg =
        err.response?.data?.errors?.documents?.[0] ||
        err.response?.data?.message ||
        'Gagal mengirimkan pendaftaran.'
      setUploadError(msg)
    } finally {
      setIsSubmittingFinal(false)
    }
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState message={error || 'Pendaftaran tidak ditemukan.'} onRetry={fetchDetail} />
        <div className="text-center mt-6">
          <Link to="/participant/registrations">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali ke Daftar Pendaftaran
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isEditable = registration.status === 'draft' || registration.status === 'revision_required'

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/participant/registrations" className="hover:text-slate-800">
          Pendaftaran Saya
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800 font-mono">{registration.registration_number}</span>
      </nav>

      {/* Header Banner */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {registration.registration_number}
              </span>
              {getStatusBadge(registration.status)}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {registration.competition?.name}
            </h1>
          </div>

          <div className="text-right text-xs text-slate-500">
            <span className="block font-medium">Kategori: {registration.competition?.category?.name}</span>
            <span className="block text-emerald-700 font-bold text-sm">
              {formatRegistrationFee(getLockedRegistrationFee(registration))}
            </span>
          </div>
        </div>

        {/* Admin Notes Box if Revision Required or Rejected */}
        {registration.admin_notes && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs uppercase tracking-wider text-amber-800">
                Catatan Evaluasi Panitia:
              </p>
              <p className="text-xs sm:text-sm leading-relaxed">{registration.admin_notes}</p>
            </div>
          </div>
        )}

        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sukses!</p>
              <p className="text-xs text-emerald-800 mt-0.5">{submitSuccess}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Payment, Documents & Requirements */}
        <div className="lg:col-span-8 space-y-8">
          <RegistrationPaymentPanel
            registration={registration}
            currentUser={user}
            onPaymentUpdated={fetchDetail}
          />

          {/* Document Upload Section */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[var(--color-brand-blue)]" />
                <h3 className="font-bold text-base text-slate-900">Berkas Dokumen Persyaratan</h3>
              </div>
              <span className="text-xs text-slate-500">
                {registration.documents?.length ?? 0} berkas terunggah
              </span>
            </div>

            {/* Upload Form if Editable */}
            {isEditable && (
              <form onSubmit={handleUploadDocument} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Unggah / Perbarui Berkas Dokumen
                </h4>

                {uploadError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs">
                    {uploadSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Jenis Dokumen</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                    >
                      <option value="ktm">Kartu Pelajar / Kartu Tanda Mahasiswa (KTM)</option>
                      <option value="surat_delegasi">Surat Keterangan / Delegasi Institusi</option>
                      <option value="lainnya">Dokumen Pendukung Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Pilih Berkas (PDF, JPG, PNG maks 5MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[var(--color-brand-orange-dark)] hover:file:bg-orange-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isUploading}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Unggah Dokumen
                  </Button>
                </div>
              </form>
            )}

            {/* Document List */}
            {registration.documents && registration.documents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {registration.documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{doc.original_filename}</span>
                        <Badge
                          variant={
                            doc.verification_status === 'verified'
                              ? 'success'
                              : doc.verification_status === 'rejected'
                              ? 'danger'
                              : 'default'
                          }
                          size="sm"
                        >
                          {doc.verification_status === 'verified'
                            ? 'Terverifikasi'
                            : doc.verification_status === 'rejected'
                            ? 'Ditolak'
                            : 'Menunggu'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Jenis: {doc.document_type.toUpperCase()} • Ukuran: {(doc.file_size / 1024).toFixed(0)} KB
                      </p>
                    </div>

                    <a
                      href={doc.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-[var(--color-brand-blue)] font-semibold p-1.5 rounded hover:bg-slate-100"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-slate-500">
                Belum ada berkas dokumen yang diunggah. Wajib mengunggah minimal satu kartu identitas.
              </p>
            )}
          </Card>

          {/* Submission Preview Card if Approved */}
          {registration.status === 'approved' && (
            <Card className="p-6 sm:p-8 space-y-4 bg-emerald-50/40 border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Pendaftaran Telah Disetujui!</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Selamat! Berkas pendaftaran Anda telah disetujui oleh panitia. Sekarang Anda dapat mengakses halaman pengumpulan karya (submission) untuk mengunggah proposal, repository, atau link demonstrasi.
              </p>
              <div className="pt-2">
                <Link to="/participant/submissions">
                  <Button variant="primary" size="sm" rightIcon={<Send className="w-4 h-4" />}>
                    Buka Halaman Submisi Karya
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (4 cols): Team & Final Submit Action */}
        <div className="lg:col-span-4 space-y-6">
          {/* Team / Participant Info Card */}
          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{registration.team ? 'Data Tim Peserta' : 'Data Peserta Individu'}</span>
            </h4>

            {registration.team ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Nama Tim:</span>
                  <span className="font-bold text-slate-800 text-sm">{registration.team.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Kode Tim:</span>
                  <span className="font-mono font-semibold text-slate-700">{registration.team.team_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Anggota Tim:</span>
                  <ul className="space-y-1.5">
                    {registration.team.members?.map((m) => (
                      <li key={m.id} className="p-2 rounded bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{m.name}</p>
                          <p className="text-[10px] text-slate-400">{m.email}</p>
                        </div>
                        <Badge size="sm" variant={m.member_role === 'leader' ? 'primary' : 'default'}>
                          {m.member_role === 'leader' ? 'Ketua' : 'Anggota'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Nama Peserta:</span>
                  <span className="font-bold text-slate-800">{registration.participant?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Alamat Email:</span>
                  <span className="text-slate-700">{registration.participant?.email}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Final Submission Card */}
          {isEditable && (
            <Card className="p-6 space-y-4 border-[var(--color-brand-orange)]/40 bg-orange-50/20">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Kirim Pendaftaran Final</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pastikan seluruh dokumen identitas telah terunggah dengan benar sebelum mengirimkan pendaftaran.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full font-bold shadow-sm"
                onClick={handleSubmitFinal}
                isLoading={isSubmittingFinal}
                leftIcon={<Send className="w-4 h-4" />}
                disabled={(registration.documents?.length ?? 0) === 0}
              >
                Kirim Pendaftaran Sekarang
              </Button>

              {(registration.documents?.length ?? 0) === 0 && (
                <p className="text-[11px] text-amber-700 text-center">
                  * Unggah minimal satu dokumen terlebih dahulu.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
