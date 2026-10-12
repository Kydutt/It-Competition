import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  Award,
  Sparkles
} from 'lucide-react';
import competitionService from '../../services/competitionService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { COMPETITIONS_DATA, FESTIVAL_INFO } from '../../data/festivalData';

export const CompetitionDetailPage = () => {
  const { slug } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        // Try backend API first
        const res = await competitionService.getCompetitionBySlug(slug);
        if (res && res.success && res.data) {
          setCompetition(res.data);
          setError(null);
          return;
        }
      } catch (err) {
        // Graceful fallback to rich local festival data
      }

      // Check local data
      const localComp = COMPETITIONS_DATA.find((c) => c.slug === slug);
      if (localComp) {
        setCompetition(localComp);
        setError(null);
      } else {
        setError('Cabang kompetisi tidak ditemukan atau URL tidak valid.');
      }
      setLoading(false);
    };

    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#FF6A00]/20 border-t-[#FF6A00] rounded-full animate-spin"></div>
        <p className="font-mono text-sm text-[#FFB36B]">MEMUAT SPESIFIKASI TEKNIS LOMBA...</p>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-28 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#211811] border border-[rgba(255,179,107,0.3)] text-[#FF6A00] flex items-center justify-center mx-auto text-2xl font-bold shadow-orange-glow">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black font-display text-[#FFF7F0]">
          Cabang Kompetisi Tidak Ditemukan
        </h2>
        <p className="text-sm text-[#C4B3A7]">
          {error || 'Informasi cabang kompetisi yang Anda cari belum tersedia.'}
        </p>
        <Link to="/competitions">
          <Button variant="primary">Kembali ke Daftar Lomba</Button>
        </Link>
      </div>
    );
  }

  const {
    title = competition.name,
    name = title,
    category_label = competition.category,
    target_level_label = 'Mahasiswa & SMA/SMK',
    theme,
    shortDescription = competition.description,
    description = shortDescription,
    overview,
    prizePool = 'Rp 10.000.000',
    prize_first,
    prize_second,
    prize_third,
    team_format = 'Tim (1 - 3 Anggota)',
    min_team_member = 1,
    max_team_member = 3,
    registration_fee = 50000,
    registration_fee_formatted = 'Rp 50.000',
    quota = 50,
    stages = [],
    eligibility = [],
    criteria = [],
    faqs = [],
    guidebook_url = FESTIVAL_INFO.guidebookUrl,
  } = competition;

  const formattedFee = typeof registration_fee === 'number' && registration_fee > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(registration_fee)
    : registration_fee_formatted || 'Gratis';

  return (
    <div className="relative py-28 sm:py-32 bg-[#100B08] overflow-hidden">
      {/* Ambient Radial Lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,rgba(255,106,0,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="text-xs font-mono text-[#948277] flex items-center gap-2">
          <Link to="/" className="hover:text-[#FFB36B] transition-colors">Beranda</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[rgba(255,179,107,0.3)]" />
          <Link to="/competitions" className="hover:text-[#FFB36B] transition-colors">Kompetisi</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[rgba(255,179,107,0.3)]" />
          <span className="text-[#FFB36B] truncate">{title}</span>
        </nav>

        {/* Header Hero Banner */}
        <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.22)] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-4xl space-y-6">
            
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="primary" className="text-xs">
                {category_label}
              </Badge>
              <Badge variant="fest" className="text-xs">
                {target_level_label}
              </Badge>
              <Badge variant="cyber" className="text-xs">
                Pendaftaran Terbuka
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black font-display text-[#FFF7F0] tracking-tight leading-tight">
              {title}
            </h1>

            {/* Theme Tag */}
            {theme && (
              <div className="inline-block bg-[#211811] px-4 py-2 rounded-xl border border-[rgba(255,179,107,0.2)]">
                <span className="text-xs font-mono font-bold text-[#FF6A00] block uppercase tracking-wider mb-0.5">
                  TEMA PERLOMBAAN:
                </span>
                <span className="text-sm font-semibold text-[#FFF7F0]">
                  {theme}
                </span>
              </div>
            )}

            <p className="text-base sm:text-lg text-[#C4B3A7] leading-relaxed font-sans max-w-3xl">
              {description}
            </p>

            {/* Action CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link to="/register">
                <Button variant="glow" size="lg" className="gap-2">
                  <span>Daftar Tim Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href={guidebook_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg" className="gap-2">
                  <FileText className="w-4 h-4 text-[#FF7A1A]" />
                  <span>Download Guidebook PDF</span>
                </Button>
              </a>
            </div>

          </div>
        </div>

        {/* Quick Specs Highlight Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#17110D] p-5 rounded-2xl border border-[rgba(255,179,107,0.16)] space-y-1">
            <span className="text-xs font-mono text-[#948277] uppercase block">Total Hadiah</span>
            <span className="text-xl sm:text-2xl font-black font-display text-[#FF6A00]">{prizePool}</span>
          </div>

          <div className="bg-[#17110D] p-5 rounded-2xl border border-[rgba(255,179,107,0.16)] space-y-1">
            <span className="text-xs font-mono text-[#948277] uppercase block">Biaya Registrasi</span>
            <span className="text-xl sm:text-2xl font-black font-display text-[#FFF7F0]">{formattedFee}</span>
          </div>

          <div className="bg-[#17110D] p-5 rounded-2xl border border-[rgba(255,179,107,0.16)] space-y-1">
            <span className="text-xs font-mono text-[#948277] uppercase block">Format Tim</span>
            <span className="text-lg sm:text-xl font-bold font-display text-[#FFF7F0]">{team_format}</span>
          </div>

          <div className="bg-[#17110D] p-5 rounded-2xl border border-[rgba(255,179,107,0.16)] space-y-1">
            <span className="text-xs font-mono text-[#948277] uppercase block">Kuota Peserta</span>
            <span className="text-lg sm:text-xl font-bold font-display text-[#FFB36B]">{quota} Tim Maksimal</span>
          </div>
        </div>

        {/* Main Content Details Grid (2 Columns: Left Tabs/Content, Right Summary Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 cols): Interactive Details */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Overview Card */}
            <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF6A00]" />
                <span>Gambaran Umum Kompetisi</span>
              </h3>
              <p className="text-sm sm:text-base text-[#C4B3A7] leading-relaxed font-sans">
                {overview || description}
              </p>
            </div>

            {/* Stages & Timeline Card */}
            {stages && stages.length > 0 && (
              <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-6 sm:p-8 space-y-6">
                <h3 className="text-xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FF7A1A]" />
                  <span>Tahapan & Timeline Lomba</span>
                </h3>
                <div className="space-y-4">
                  {stages.map((stage, idx) => (
                    <div key={idx} className="bg-[#211811] p-4 sm:p-5 rounded-2xl border border-[rgba(255,179,107,0.12)] space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#FFF7F0] text-sm sm:text-base font-display">
                          {idx + 1}. {stage.name}
                        </span>
                        <span className="font-mono text-xs text-[#FFB36B] bg-[#17110D] px-2.5 py-1 rounded-lg border border-[rgba(255,179,107,0.15)]">
                          {stage.date}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#948277]">
                        {stage.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility Requirements */}
            <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#FFB36B]" />
                <span>Ketentuan & Syarat Kelayakan Peserta</span>
              </h3>
              <ul className="space-y-3 text-sm text-[#C4B3A7]">
                {(eligibility.length > 0 ? eligibility : [
                  'Peserta merupakan mahasiswa aktif (D3/D4/S1) atau siswa SMA/SMK se-Indonesia.',
                  'Setiap tim wajib mengunggah kartu identitas aktif (KTM / Kartu Pelajar).',
                  'Karya yang dilombakan harus orisinal dan belum pernah memenangkan kompetisi sejenis.',
                  'Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.',
                ]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Judging Criteria */}
            {criteria && criteria.length > 0 && (
              <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FF6A00]" />
                  <span>Kriteria & Bobot Penilaian</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {criteria.map((crit, idx) => (
                    <div key={idx} className="bg-[#211811] p-4 rounded-xl border border-[rgba(255,179,107,0.12)] flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#FFF7F0]">{crit.name}</span>
                      <span className="font-mono text-xs font-bold text-[#FF6A00] bg-[#17110D] px-2.5 py-1 rounded-md">
                        {crit.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category FAQs */}
            {faqs && faqs.length > 0 && (
              <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#FF7A1A]" />
                  <span>Pertanyaan Spesifik Cabang Lomba</span>
                </h3>
                <div className="space-y-3">
                  {faqs.map((f, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.12)] space-y-1">
                      <p className="text-sm font-bold text-[#FFB36B]">{f.q}</p>
                      <p className="text-xs sm:text-sm text-[#C4B3A7]">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (4 cols): Sticky Registration Sidebar Box */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            
            {/* Action Box */}
            <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.22)] rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#948277] uppercase block">
                  REGISTRASI TIM // NEXUS 2026
                </span>
                <h4 className="text-lg font-bold font-display text-[#FFF7F0]">
                  Siap Bersaing di Cabang Ini?
                </h4>
              </div>

              {/* Prize Highlight */}
              {(prize_first || prizePool) && (
                <div className="bg-[#211811] p-4 rounded-2xl border border-[rgba(255,179,107,0.15)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#FF6A00] font-bold">
                    <Trophy className="w-4 h-4" />
                    <span>HADIAH JUARA 1:</span>
                  </div>
                  <p className="text-sm font-bold text-[#FFF7F0]">
                    {prize_first || prizePool}
                  </p>
                  {prize_second && (
                    <p className="text-xs text-[#C4B3A7] pt-1 border-t border-[rgba(255,179,107,0.08)]">
                      Juara 2: {prize_second}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link to="/register" className="block">
                  <Button variant="glow" size="lg" className="w-full">
                    Daftar Sekarang &rarr;
                  </Button>
                </Link>
                <a href={guidebook_url} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="secondary" size="md" className="w-full gap-2">
                    <FileText className="w-4 h-4 text-[#FF7A1A]" />
                    <span>Download Guidebook</span>
                  </Button>
                </a>
              </div>

              {/* Helpdesk Notice */}
              <div className="pt-2 text-center text-xs text-[#948277] font-mono">
                Butuh bantuan? Hubungi WhatsApp panitia di {FESTIVAL_INFO.contactWhatsapp}
              </div>
            </div>

            {/* Back to all competitions link */}
            <div className="text-center">
              <Link to="/competitions" className="text-xs font-mono text-[#FFB36B] hover:underline">
                &larr; Lihat 5 Cabang Lomba Lainnya
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CompetitionDetailPage;
