import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const CompetitionDetailPage = () => {
  const { slug } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await competitionService.getCompetitionBySlug(slug);
        if (res.success && res.data) {
          setCompetition(res.data);
        } else {
          setError('Kompetisi tidak ditemukan atau belum dipublikasikan.');
        }
      } catch (err) {
        console.error('Error loading competition detail:', err);
        setError('Kompetisi tidak ditemukan atau sedang tidak tersedia.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="text-center py-28">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-gray-500">Memuat rincian kompetisi...</p>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Kompetisi Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">{error || 'Cabang lomba yang Anda cari tidak aktif atau belum dipublikasikan.'}</p>
        <Link to="/competitions">
          <Button variant="primary">Kembali ke Daftar Lomba</Button>
        </Link>
      </div>
    );
  }

  const {
    name,
    category_label,
    target_level_label,
    theme,
    description,
    registration_fee = 0,
    quota = 50,
    min_team_member = 1,
    max_team_member = 3,
    registration_start,
    registration_end,
    submission_start,
    submission_deadline,
    status = 'draft',
    status_label,
    guidebook_url,
    criteria = [],
  } = competition;

  const formattedFee = registration_fee > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(registration_fee)
    : 'Gratis';

  const formatFullDate = (dateStr) => {
    if (!dateStr) return 'Belum ditentukan';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const statusVariant = {
    registration_open: 'success',
    registration_closed: 'warning',
    submission_open: 'primary',
    judging: 'info',
    finished: 'default',
    draft: 'default',
    archived: 'default',
  }[status] || 'default';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumb */}
      <nav className="text-xs font-semibold text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-brand-600">Beranda</Link>
        <span>/</span>
        <Link to="/competitions" className="hover:text-brand-600">Kompetisi</Link>
        <span>/</span>
        <span className="text-gray-900 truncate">{name}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-12 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" className="font-semibold">
              {category_label || competition.category}
            </Badge>
            <Badge variant="info" className="font-semibold">
              {target_level_label || (competition.target_level === 'university' ? 'Mahasiswa' : 'Siswa SMA/SMK')}
            </Badge>
            <Badge variant={statusVariant} className="font-semibold">
              Status: {status_label || status}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight">
            {name}
          </h1>

          {theme && (
            <div className="py-1">
              <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200/60 rounded-xl px-3.5 py-1.5 inline-block">
                Tema: {theme}
              </span>
            </div>
          )}

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed pt-2">
            {description}
          </p>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Button
                variant="primary"
                size="lg"
                className="font-bold opacity-60 cursor-not-allowed shadow-xs"
                disabled
              >
                Daftar Kompetisi (Segera di Fase 3) &rarr;
              </Button>
              <div className="absolute left-0 -top-9 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
                Pendaftaran tim resmi dibuka pada Phase 3
              </div>
            </div>

            {guidebook_url && (
              <a href={guidebook_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="font-bold">
                  Unduh Guidebook PDF
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Specifications & Criteria Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Requirements & Criteria */}
        <div className="lg:col-span-2 space-y-8">
          {/* Rules & Team Size */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-2xs space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Ketentuan & Format Tim</h3>
            <ul className="space-y-3 text-sm text-gray-600 list-disc list-inside leading-relaxed">
              <li>
                Format peserta: <strong>{min_team_member === max_team_member ? `${min_team_member} peserta per tim` : `${min_team_member} hingga ${max_team_member} peserta per tim`}</strong>.
              </li>
              <li>
                Sasaran jenjang: <strong>{target_level_label || competition.target_level}</strong> aktif di wilayah Ciayumajakuning atau perwakilan nasional.
              </li>
              <li>
                Batas kuota pendaftaran maksimal: <strong>{quota} tim/peserta</strong>.
              </li>
              <li>
                Karya yang dikumpulkan harus orisinal, belum pernah dipublikasikan atau memenangkan perlombaan sejenis.
              </li>
              <li>
                Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.
              </li>
            </ul>
          </div>

          {/* Judging Criteria */}
          {criteria && criteria.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-2xs space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Kriteria Penilaian Juri</h3>
              <p className="text-xs text-gray-500">Pedoman bobot penilaian yang akan digunakan oleh dewan juri ahli:</p>
              <div className="divide-y divide-gray-100">
                {criteria.map((crit, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{crit.name}</p>
                      {crit.description && <p className="text-xs text-gray-500 mt-0.5">{crit.description}</p>}
                    </div>
                    <Badge variant="primary" className="font-bold shrink-0">
                      Bobot: {crit.weight}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata Timeline & Specs Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5">
            <h4 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Informasi Pendaftaran & Jadwal
            </h4>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 block font-medium mb-0.5">Biaya Registrasi</span>
                <span className="text-xl font-black text-brand-600">{formattedFee}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block font-medium mb-0.5">Kapasitas Kuota</span>
                <span className="font-semibold text-gray-900">{quota} Tim</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block font-medium mb-0.5">Anggota Tim</span>
                <span className="font-semibold text-gray-900">
                  {min_team_member === max_team_member ? `${min_team_member} Peserta` : `${min_team_member} - ${max_team_member} Peserta`}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 block font-medium mb-0.5">Periode Pendaftaran</span>
                <span className="font-medium text-gray-800 text-xs sm:text-sm">
                  {formatFullDate(registration_start)} s.d. {formatFullDate(registration_end)}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block font-medium mb-0.5">Batas Pengumpulan Karya</span>
                <span className="font-medium text-gray-800 text-xs sm:text-sm">
                  {formatFullDate(submission_deadline)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Link to="/registrations" className="block">
                <Button variant="primary" size="lg" className="w-full font-bold shadow-md shadow-brand-500/20">
                  Daftar Cabang Lomba Ini ➔
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetailPage;
