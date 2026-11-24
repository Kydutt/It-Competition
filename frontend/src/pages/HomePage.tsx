import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  ArrowRight,
  Calendar,
  Code2,
  Cpu,
  Palette,
  Shield,
  ChevronRight,
  Clock,
  Sparkles,
  Globe,
} from 'lucide-react'
import { publicService } from '../services/publicService'
import type {
  Competition,
  CompetitionCategory,
  Event,
  Faq,
  PublicStatistics,
  Schedule,
  Announcement,
} from '../types/public'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Accordion } from '../components/ui/Accordion'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { HeroIllustration } from '../components/illustrations/HeroIllustration'
import { HowItWorksIllustration } from '../components/illustrations/HowItWorksIllustration'
import { OrganicWave } from '../components/ui/OrganicWave'

export const HomePage: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null)
  const [categories, setCategories] = useState<CompetitionCategory[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [stats, setStats] = useState<PublicStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [eventsRes, catRes, compRes, schedRes, annRes, faqRes, statsRes] =
        await Promise.all([
          publicService.getEvents(),
          publicService.getCategories(),
          publicService.getCompetitions({ per_page: 6 }),
          publicService.getSchedules(),
          publicService.getAnnouncements(1, 3),
          publicService.getFaqs(),
          publicService.getStatistics(),
        ])

      if (eventsRes.data && eventsRes.data.length > 0) {
        setEvent(eventsRes.data[0])
      }
      setCategories(catRes.data || [])
      setCompetitions(compRes.data || [])
      setSchedules((schedRes.data || []).slice(0, 4))
      setAnnouncements(annRes.data || [])
      setFaqs((faqRes.data || []).slice(0, 5))
      setStats(statsRes.data || null)
    } catch (err) {
      console.error('Failed to load homepage data:', err)
      setError('Gagal memuat konten beranda dari server. Pastikan API backend aktif.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Category Icon Resolver
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('web') || lower.includes('software') || lower.includes('app')) {
      return <Code2 className="w-6 h-6 text-[#17243A]" />
    }
    if (lower.includes('data') || lower.includes('ai') || lower.includes('machine')) {
      return <Cpu className="w-6 h-6 text-[#17243A]" />
    }
    if (lower.includes('ui') || lower.includes('ux') || lower.includes('design')) {
      return <Palette className="w-6 h-6 text-[#17243A]" />
    }
    if (lower.includes('security') || lower.includes('cyber')) {
      return <Shield className="w-6 h-6 text-[#17243A]" />
    }
    return <Trophy className="w-6 h-6 text-[#17243A]" />
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <ErrorState onRetry={loadData} message={error} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFEFA]">
      {/* ========================================================= */}
      {/* B. HERO SECTION (Asymmetrical Two-Column with Illustration) */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-[#FFFEFA] pt-8 pb-12 lg:pt-14 lg:pb-20">
        {/* Subtle Organic Background Decor */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#FFF4CE]/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#F5C842]/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Bold Copywriting & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF4CE] border border-[#F5C842]/40 text-[#17243A] text-xs font-bold tracking-wider uppercase shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#E8AD22]" />
                <span>IT COMPETITION PLATFORM • {event?.name || 'FESTIVAL 2026'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#17243A] tracking-tight leading-[1.12]">
                Build Your Ideas. <br className="hidden sm:inline" />
                <span className="relative inline-block">
                  <span className="relative z-10">Compete for the Future.</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3.5 bg-[#F5C842]/60 -z-0 rounded-sm transform -rotate-1" />
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Platform kompetisi teknologi informasi untuk mempertemukan ide, kreativitas, dan kemampuan generasi digital. Uji karyamu di tingkat nasional.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/competitions" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto font-bold shadow-md hover:shadow-lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Jelajahi Kompetisi
                  </Button>
                </Link>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto font-semibold"
                  >
                    Daftar Akun Peserta
                  </Button>
                </Link>
              </div>

              {/* Highlights Micro-bar */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-[#E9E5DA] text-left">
                <div>
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Format Lomba</div>
                  <div className="text-sm font-bold text-[#17243A]">Individu & Tim</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Peserta</div>
                  <div className="text-sm font-bold text-[#17243A]">Siswa & Mahasiswa</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Registrasi</div>
                  <div className="text-sm font-bold text-emerald-700">Gratis (Rp 0)</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Focal Illustration */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <HeroIllustration className="transform hover:scale-[1.02] transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Wave transition from Warm White to Light Background */}
      <OrganicWave fill="#FAF9F5" variant="gentle" />

      {/* ========================================================= */}
      {/* C. COMPETITION CATEGORIES (Clean Studwork-style Cards) */}
      {/* ========================================================= */}
      <section className="bg-[#FAF9F5] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold text-[#E8AD22] tracking-wider uppercase">
                BIDANG KEAHLIAN
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17243A] tracking-tight">
                Kategori Kompetisi
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Pilih cabang keilmuan yang ingin kamu tekuni, dari pengembangan perangkat lunak hingga analisis data.
              </p>
            </div>
            <Link to="/competitions">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Lihat Semua ({categories.length})
              </Button>
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/competitions?category=${cat.slug}`}
                className="group block"
              >
                <Card hoverable className="p-7 h-full flex flex-col justify-between space-y-5 bg-[#FFFEFA]">
                  <div className="space-y-4">
                    <div className="w-13 h-13 rounded-2xl bg-[#FFF4CE] border border-[#F5C842]/40 flex items-center justify-center group-hover:bg-[#F5C842] group-hover:scale-105 transition-all duration-300">
                      {getCategoryIcon(cat.name)}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-lg text-[#17243A] group-hover:text-[#E8AD22] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed line-clamp-2">
                        {cat.description || 'Eksplorasi cabang perlombaan untuk menguji keterampilan teknis dan logika solusi digital.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E9E5DA] flex items-center justify-between text-xs font-bold text-[#17243A]">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF9F5] border border-[#E9E5DA] text-[11px] font-semibold text-[#64748B]">
                      {cat.competitions_count ? `${cat.competitions_count} Lomba` : 'Tersedia'}
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform text-[#17243A]">
                      Buka Katalog <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* D. FEATURED COMPETITIONS (Structured, Clean Cards) */}
      {/* ========================================================= */}
      <section className="bg-[#FAF9F5] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold text-[#E8AD22] tracking-wider uppercase">
                CABANG LOMBA UNGGULAN
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17243A] tracking-tight">
                Kompetisi yang Sedang Dibuka
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Daftarkan diri atau tim terbaikmu pada kompetisi pilihan. Persiapkan karya berkualitas tinggi.
              </p>
            </div>
            <Link to="/competitions">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Lihat Seluruh Lomba
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <CardSkeleton count={3} />
          ) : competitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map((comp) => (
                <Card key={comp.id} hoverable className="p-7 flex flex-col justify-between space-y-5 bg-[#FFFEFA]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4CE] text-[#17243A] border border-[#F5C842]/40">
                        {comp.category?.name || 'Kompetisi IT'}
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        {comp.registration_type === 'team'
                          ? `Tim (${comp.min_members}-${comp.max_members} org)`
                          : 'Individu'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xl text-[#17243A] leading-snug">
                        {comp.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#64748B] line-clamp-3 leading-relaxed">
                        {comp.short_description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E9E5DA] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#64748B] block font-medium">Biaya Partisipasi</span>
                      <span className="font-bold text-sm text-emerald-700">
                        {comp.registration_fee === 0 ? 'Gratis' : `Rp ${comp.registration_fee.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <Link to={`/competitions/${comp.slug}`}>
                      <Button variant="primary" size="sm" className="font-bold">
                        Detail Lomba
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-[#FFFEFA] rounded-2xl border border-[#E9E5DA]">
              <p className="text-sm text-[#64748B]">Belum ada kompetisi yang dipublikasikan saat ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* Wave transition into How It Works Soft Yellow Section */}
      <OrganicWave fill="#FFF4CE" variant="asymmetric" />

      {/* ========================================================= */}
      {/* E. HOW IT WORKS (Asymmetrical Layout inspired by Studwork) */}
      {/* ========================================================= */}
      <section className="bg-[#FFF4CE] py-14 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Side: Illustration in Organic Fluid Blob */}
            <div className="lg:col-span-5 flex justify-center">
              <HowItWorksIllustration className="hover:scale-105 transition-transform duration-500" />
            </div>

            {/* Right Side: Step-by-Step Flow with Large Numbers */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#E8AD22] tracking-wider uppercase">
                  PANDUAN ALUR
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#17243A] tracking-tight">
                  Bagaimana Cara Mengikuti Kompetisi?
                </h2>
                <p className="text-sm sm:text-base text-[#64748B] max-w-lg">
                  Tiga tahapan sederhana dan terstruktur untuk memulai perjalanan prestasimu di IT COMP 2026.
                </p>
              </div>

              {/* Steps List with Connecting Line */}
              <div className="relative space-y-8 pl-4 sm:pl-6 before:absolute before:left-8 sm:before:left-10 before:top-4 before:bottom-4 before:w-0.5 before:border-l-2 before:border-dashed before:border-[#E8AD22]">
                {/* Step 01 */}
                <div className="relative flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFFEFA] border-2 border-[#F5C842] flex items-center justify-center text-[#17243A] font-black text-lg shadow-sm shrink-0 group-hover:bg-[#F5C842] transition-colors">
                    01
                  </div>
                  <div className="space-y-1 pt-1">
                    <h3 className="font-extrabold text-lg text-[#17243A]">
                      Explore Competition
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-md">
                      Peserta mencari dan memilih cabang kompetisi yang sesuai dengan minat, kriteria keahlian, dan ketentuan lomba.
                    </p>
                  </div>
                </div>

                {/* Step 02 */}
                <div className="relative flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFFEFA] border-2 border-[#F5C842] flex items-center justify-center text-[#17243A] font-black text-lg shadow-sm shrink-0 group-hover:bg-[#F5C842] transition-colors">
                    02
                  </div>
                  <div className="space-y-1 pt-1">
                    <h3 className="font-extrabold text-lg text-[#17243A]">
                      Register &amp; Prepare
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-md">
                      Peserta mendaftar secara individu atau membuat tim, melengkapi profil identitas, dan mengunggah berkas persyaratan.
                    </p>
                  </div>
                </div>

                {/* Step 03 */}
                <div className="relative flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFFEFA] border-2 border-[#F5C842] flex items-center justify-center text-[#17243A] font-black text-lg shadow-sm shrink-0 group-hover:bg-[#F5C842] transition-colors">
                    03
                  </div>
                  <div className="space-y-1 pt-1">
                    <h3 className="font-extrabold text-lg text-[#17243A]">
                      Submit Your Work
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-md">
                      Peserta mengumpulkan karya sesuai format ketentuan kompetisi dan memantau status review langsung dari dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link to="/register">
                  <Button variant="secondary" size="lg" className="font-bold shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Mulai Pendaftaran Sekarang
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave transition out of How It Works into Warm White */}
      <OrganicWave fill="#FFFEFA" variant="deep" />

      {/* ========================================================= */}
      {/* F. EVENT INFORMATION (Clean Editorial Layout) */}
      {/* ========================================================= */}
      <section className="bg-[#FFFEFA] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#E9E5DA] bg-[#FAF9F5] p-8 sm:p-12 lg:p-14 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <span className="text-xs font-bold text-[#E8AD22] tracking-wider uppercase">
                  INFORMASI PERHELATAN RESMI
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#17243A] tracking-tight">
                  {event?.name || 'National IT Festival 2026'}
                </h2>
                {event?.theme && (
                  <p className="text-base sm:text-lg font-semibold text-[#17243A]/90 italic">
                    &ldquo;{event.theme}&rdquo;
                  </p>
                )}
                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl">
                  {event?.description ||
                    'Ajang kompetisi tahunan yang dirancang untuk menggali potensi, mengasah logika algoritma, dan menguji kemampuan kolaborasi peserta dalam menghasilkan solusi teknologi berdampak luas.'}
                </p>

                <div className="pt-4 flex flex-wrap gap-6 text-sm text-[#17243A]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#E8AD22]" />
                    <span className="font-medium">
                      {event?.start_date
                        ? `${new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : 'Oktober 2026'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#E8AD22]" />
                    <span className="font-medium">{event?.location || 'Auditorium Kampus & Daring (Hybrid)'}</span>
                  </div>
                  {stats && (
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Trophy className="w-4 h-4 text-[#E8AD22]" />
                      <span className="font-semibold text-[#17243A]">
                        {stats.total_competitions} Cabang Lomba • {stats.total_registrations} Pendaftar
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-start lg:justify-end">
                <Link to="/competitions">
                  <Button variant="primary" size="lg" className="font-bold shadow-sm">
                    Lihat Panduan &amp; Lomba
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* G. SCHEDULE PREVIEW (Clean Editorial Timeline) */}
      {/* ========================================================= */}
      <section className="bg-[#FFFEFA] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold text-[#E8AD22] tracking-wider uppercase">
                AGENDA PERHELATAN
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17243A] tracking-tight">
                Jadwal &amp; Timeline Penting
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Catat tanggal-tanggal krusial mulai dari pembukaan pendaftaran hingga pengumuman pemenang.
              </p>
            </div>
            <Link to="/schedule">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Lihat Jadwal Lengkap
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {schedules.map((item, idx) => (
              <Card key={item.id} hoverable className="p-6 space-y-3 bg-[#FAF9F5]">
                <div className="w-8 h-8 rounded-xl bg-[#FFF4CE] text-[#17243A] font-black text-xs flex items-center justify-center border border-[#F5C842]/50">
                  {idx + 1}
                </div>
                <h3 className="font-extrabold text-[#17243A] text-base leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-3 border-t border-[#E9E5DA] flex items-center gap-2 text-xs font-semibold text-[#17243A]">
                  <Calendar className="w-3.5 h-3.5 text-[#E8AD22]" />
                  <span>
                    {new Date(item.start_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* H. ANNOUNCEMENTS (Minimalist Editorial News Cards) */}
      {/* ========================================================= */}
      {announcements.length > 0 && (
        <section className="bg-[#FAF9F5] py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-bold text-[#E8AD22] tracking-wider uppercase">
                  INFORMASI TERKINI
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17243A] tracking-tight">
                  Pengumuman Resmi
                </h2>
                <p className="text-sm sm:text-base text-[#64748B]">
                  Pemberitahuan resmi dan berkala dari panitia penyelenggara terkait jalannya kompetisi.
                </p>
              </div>
              <Link to="/announcements">
                <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Semua Pengumuman
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((ann) => (
                <Card key={ann.id} hoverable className="p-7 flex flex-col justify-between space-y-4 bg-[#FFFEFA]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Clock className="w-3.5 h-3.5 text-[#E8AD22]" />
                      <span>
                        {new Date(ann.published_at || ann.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-lg text-[#17243A] line-clamp-2">
                      {ann.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] line-clamp-3 leading-relaxed">
                      {ann.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E9E5DA]">
                    <Link
                      to={`/announcements/${ann.slug}`}
                      className="text-xs font-bold text-[#17243A] hover:text-[#E8AD22] inline-flex items-center gap-1 transition-colors"
                    >
                      Baca Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* I. FAQ SECTION (Clean Accordion) */}
      {/* ========================================================= */}
      <section className="bg-[#FFFEFA] py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#E8AD22] tracking-wider uppercase">
              PERTANYAAN UMUM
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17243A] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto">
              Jawaban ringkas atas pertanyaan paling sering diajukan mengenai registrasi, tim, dan pengumpulan karya.
            </p>
          </div>

          {faqs.length > 0 ? (
            <Accordion
              items={faqs.map((f) => ({
                id: f.id,
                title: f.question,
                content: f.answer,
              }))}
              defaultOpenId={faqs[0]?.id}
            />
          ) : (
            <p className="text-center text-sm text-[#64748B]">Daftar FAQ akan segera diperbarui oleh panitia.</p>
          )}

          <div className="text-center pt-2">
            <Link to="/faq">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Buka Seluruh Pertanyaan FAQ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CALL TO ACTION BANNER (Inspiring Educational Banner) */}
      {/* ========================================================= */}
      <section className="bg-[#FFFEFA] pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#FFF4CE] border border-[#F5C842]/40 p-8 sm:p-14 relative overflow-hidden text-center sm:text-left">
            {/* Background Accent Graphics */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5C842]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="text-xs font-black text-[#17243A] tracking-wider uppercase bg-[#F5C842] px-3 py-1 rounded-full inline-block">
                GABUNG SEKARANG
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#17243A] tracking-tight leading-snug">
                Waktunya Menunjukkan Karyamu di Panggung Teknologi Nasional
              </h2>
              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed">
                Pendaftaran tidak dipungut biaya. Bangun tim, selesaikan tantangan nyata, dan jadilah inovator digital masa depan.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-start">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold shadow-md">
                    Daftar Akun Sekarang
                  </Button>
                </Link>
                <Link to="/competitions" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold bg-[#FFFEFA]">
                    Pelajari Kategori Lomba
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
