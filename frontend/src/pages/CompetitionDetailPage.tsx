import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Calendar,
  Users,
  Clock,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { publicService } from '../services/publicService'
import type { Competition } from '../types/public'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/ErrorState'

export const CompetitionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await publicService.getCompetitionBySlug(slug)
      setCompetition(res.data)
    } catch (err) {
      console.error('Failed to load competition detail:', err)
      setError('Kompetisi tidak ditemukan atau belum dipublikasikan.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [slug])

  if (isLoading) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Skeleton className="h-6 w-48 rounded-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-10 w-3/4 rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !competition) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4">
          <ErrorState
            title="Kompetisi Tidak Ditemukan"
            message={error || 'Informasi kompetisi tidak dapat dimuat.'}
            onRetry={fetchDetail}
          />
          <div className="text-center mt-6">
            <Link to="/competitions">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Katalog Kompetisi
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isRegistrationOpen = competition.status === 'registration_open'

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
          <Link to="/" className="hover:text-[#17243A]">
            Beranda
          </Link>
          <span>/</span>
          <Link to="/competitions" className="hover:text-[#17243A]">
            Kompetisi
          </Link>
          <span>/</span>
          <span className="text-[#17243A] truncate max-w-xs">{competition.name}</span>
        </nav>

        {/* Hero Header Card */}
        <div className="bg-[#FFFEFA] rounded-3xl border border-[#E9E5DA] p-6 sm:p-10 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4CE] text-[#17243A] border border-[#F5C842]/40">
              {competition.category?.name || 'Kompetisi IT'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF9F5] text-[#17243A] border border-[#E9E5DA]">
              <Users className="w-3.5 h-3.5 mr-1 inline" />
              {competition.registration_type === 'team'
                ? `Kategori Tim (${competition.min_members} - ${competition.max_members} Anggota)`
                : 'Kategori Individu'}
            </span>
            <Badge variant={isRegistrationOpen ? 'success' : 'warning'}>
              {isRegistrationOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#17243A] tracking-tight leading-snug">
              {competition.name}
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] max-w-3xl leading-relaxed">
              {competition.short_description}
            </p>
          </div>
        </div>

        {/* Main Grid: Left Details & Right Sticky Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Description, Eligibility, Rules */}
          <div className="lg:col-span-8 space-y-8">
            {/* Deskripsi Lengkap */}
            <Card className="p-6 sm:p-9 space-y-4 bg-[#FFFEFA]">
              <h2 className="text-lg font-extrabold text-[#17243A] border-b border-[#E9E5DA] pb-3 flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#E8AD22]" />
                Deskripsi &amp; Gambaran Kompetisi
              </h2>
              <div className="text-sm text-[#17243A]/90 leading-relaxed whitespace-pre-line font-normal">
                {competition.description}
              </div>
            </Card>

            {/* Persyaratan & Kriteria Eligibility */}
            <Card className="p-6 sm:p-9 space-y-4 bg-[#FFFEFA]">
              <h2 className="text-lg font-extrabold text-[#17243A] border-b border-[#E9E5DA] pb-3 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Ketentuan &amp; Persyaratan Peserta
              </h2>
              <div className="space-y-3 text-sm text-[#17243A]/90">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{competition.eligibility}</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {competition.registration_type === 'team'
                      ? `Setiap tim beranggotakan ${competition.min_members} hingga ${competition.max_members} orang, dipimpin oleh seorang Ketua Tim.`
                      : 'Peserta mendaftar secara perorangan (individu).'}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Wajib melampirkan identitas sah (Kartu Tanda Mahasiswa atau Kartu Pelajar aktif) pada saat pendaftaran.
                  </span>
                </div>
              </div>
            </Card>

            {/* Alur Tahapan */}
            <Card className="p-6 sm:p-9 space-y-4 bg-[#FFFEFA]">
              <h2 className="text-lg font-extrabold text-[#17243A] border-b border-[#E9E5DA] pb-3 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#E8AD22]" />
                Alur Pelaksanaan Lomba
              </h2>
              <div className="space-y-4 text-sm text-[#17243A]/90">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FFF4CE] text-[#17243A] flex items-center justify-center font-bold text-xs shrink-0 border border-[#F5C842]/50">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-[#17243A]">Pendaftaran Akun &amp; Verifikasi</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Registrasi akun di platform, buat tim (jika beregu), lengkapi berkas identitas anggota.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FFF4CE] text-[#17243A] flex items-center justify-center font-bold text-xs shrink-0 border border-[#F5C842]/50">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-[#17243A]">Verifikasi Panitia</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Admin panitia memverifikasi kesesuaian dokumen dan status kepesertaan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FFF4CE] text-[#17243A] flex items-center justify-center font-bold text-xs shrink-0 border border-[#F5C842]/50">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-[#17243A]">Pengumpulan Karya (Submission)</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Kumpulkan berkas karya atau link demonstrasi sesuai buku panduan teknis sebelum batas akhir.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column (4 cols): Sticky Action & Summary Card */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <Card className="p-7 space-y-6 bg-[#FFFEFA]">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  STATUS REGISTRASI
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-[#17243A]">
                    {isRegistrationOpen ? 'Dibuka' : 'Ditutup'}
                  </span>
                  <span className="font-extrabold text-lg text-emerald-700">
                    {competition.registration_fee === 0
                      ? 'Gratis'
                      : `Rp ${competition.registration_fee.toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>

              {/* Important Dates */}
              <div className="space-y-3 pt-4 border-t border-[#E9E5DA] text-xs">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#E8AD22] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#64748B] block font-medium">Batas Pendaftaran:</span>
                    <span className="font-bold text-[#17243A]">
                      {competition.registration_deadline
                        ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Belum ditentukan'}
                    </span>
                  </div>
                </div>

                {competition.submission_deadline && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#E8AD22] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#64748B] block font-medium">Batas Submit Karya:</span>
                      <span className="font-bold text-[#17243A]">
                        {new Date(competition.submission_deadline).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action CTA */}
              <div className="pt-2">
                {isRegistrationOpen ? (
                  <Link
                    to={`/login?redirect=/participant/registrations/create?competition=${competition.slug}`}
                    className="block"
                  >
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full font-bold shadow-md hover:shadow-lg"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Daftar Kompetisi Ini
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="md" disabled className="w-full">
                    Pendaftaran Telah Ditutup
                  </Button>
                )}
                <p className="text-[11px] text-center text-[#64748B] mt-2.5 font-medium">
                  Belum memiliki akun?{' '}
                  <Link to="/register" className="text-[#17243A] hover:underline font-bold">
                    Daftar di sini
                  </Link>
                </p>
              </div>

              {/* Helpdesk Contact */}
              {competition.contact_information && (
                <div className="pt-4 border-t border-[#E9E5DA] space-y-2">
                  <h4 className="text-xs font-bold text-[#17243A] uppercase tracking-wider">
                    Narahubung Lomba
                  </h4>
                  {competition.contact_information.email && (
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Mail className="w-3.5 h-3.5 text-[#E8AD22]" />
                      <span>{competition.contact_information.email}</span>
                    </div>
                  )}
                  {competition.contact_information.whatsapp && (
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Phone className="w-3.5 h-3.5 text-[#E8AD22]" />
                      <span>WhatsApp: {competition.contact_information.whatsapp}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
