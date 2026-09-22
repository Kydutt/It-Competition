import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import CompetitionGrid from '../../components/competition/CompetitionGrid';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const HomePage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await competitionService.getCompetitions();
        if (res.success && res.data) {
          const items = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setCompetitions(items);
        }
      } catch (err) {
        console.error('Failed to load competitions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitions();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-gray-50 pt-20 pb-24 border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-100/70 border border-brand-200 text-brand-800 text-xs font-bold uppercase tracking-wider">
              <span>HIMATIF IT Competition 2026</span>
              <span className="text-brand-400">•</span>
              <span>Ciayumajakuning</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-tight">
              Create. Innovate. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500">
                Compete for Excellence.
              </span>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Ajang kompetisi teknologi, perancangan antarmuka, dan inovasi ilmiah terbesar untuk Mahasiswa serta Siswa SMA/SMK se-wilayah Cirebon, Indramayu, Majalengka, dan Kuningan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold px-8 shadow-md hover:shadow-lg">
                  Daftar Sekarang &rarr;
                </Button>
              </Link>
              <Link to="/competitions">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold px-8">
                  Eksplorasi Cabang Lomba
                </Button>
              </Link>
            </div>

            {/* Region Pills */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-gray-500">
              <span className="text-gray-400">Wilayah Resmi:</span>
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200 shadow-2xs">Kab/Kota Cirebon</span>
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200 shadow-2xs">Indramayu</span>
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200 shadow-2xs">Majalengka</span>
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200 shadow-2xs">Kuningan</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & PRIZE HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-800">
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-brand-400">4 Cabang</p>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mt-1">Lomba Bergengsi</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-amber-400">Rp 15+ Juta</p>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mt-1">Total Hadiah & Pembinaan</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">2 Tingkat</p>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mt-1">Mahasiswa & Siswa SMA/SMK</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-sky-400">Dewan Juri</p>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mt-1">Praktisi & Akademisi Pakar</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPETITION CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
              Pilihan Bidang
            </span>
            <h2 className="text-3xl font-black text-gray-950 tracking-tight">
              Cabang Kompetisi 2026
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Pilih kompetisi sesuai kategori tingkat pendidikan Anda
            </p>
          </div>
          <Link to="/competitions">
            <Button variant="ghost" size="sm" className="font-semibold text-brand-600">
              Lihat Semua Informasi & Ketentuan &rarr;
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Memuat daftar kompetisi...</p>
          </div>
        ) : (
          <CompetitionGrid competitions={competitions} />
        )}
      </section>

      {/* 4. TIMELINE SNAPSHOT */}
      <section className="bg-gray-100/70 py-16 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-black text-gray-950 tracking-tight">
              Timeline Pelaksanaan
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Catat setiap tanggal penting agar tim Anda tidak melewatkan tenggat waktu pengumpulan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-bold text-brand-600 uppercase">Fase 1</span>
              <h4 className="font-bold text-gray-900 mt-1">Pendaftaran & Administrasi</h4>
              <p className="text-xs text-gray-500 mt-1">Registrasi akun, pembentukan tim, dan pembayaran.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-bold text-brand-600 uppercase">Fase 2</span>
              <h4 className="font-bold text-gray-900 mt-1">Pengumpulan Karya</h4>
              <p className="text-xs text-gray-500 mt-1">Upload proposal LKTI, file desain UI/UX, atau kode web.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-bold text-brand-600 uppercase">Fase 3</span>
              <h4 className="font-bold text-gray-900 mt-1">Penilaian Dewan Juri</h4>
              <p className="text-xs text-gray-500 mt-1">Evaluasi karya sesuai rubrik penilaian terstandarisasi.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-bold text-brand-600 uppercase">Fase 4</span>
              <h4 className="font-bold text-gray-900 mt-1">Awarding & Pengumuman</h4>
              <p className="text-xs text-gray-500 mt-1">Pengumuman juara di website dan penyerahan penghargaan.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
