import React, { useState, useEffect, useCallback } from 'react';
import competitionService from '../../services/competitionService';
import CompetitionGrid from '../../components/competition/CompetitionGrid';
import Button from '../../components/ui/Button';

export const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [targetLevel, setTargetLevel] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 8,
      };

      if (targetLevel !== 'all') {
        params.target_level = targetLevel;
      }

      if (category !== 'all') {
        params.category = category;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await competitionService.getCompetitions(params);
      if (res.success && res.data) {
        const items = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setCompetitions(items);
        const meta = res.data.meta || res.meta;
        if (meta) {
          setTotalPages(meta.last_page || 1);
          setTotalCount(meta.total ?? items.length);
        } else {
          setTotalPages(1);
          setTotalCount(items.length);
        }
      }
    } catch (err) {
      console.error('Failed to load competitions:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat data kompetisi. Silakan coba kembali.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [page, targetLevel, category, search]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setTargetLevel('all');
    setCategory('all');
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
          HIMATIF IT Competition 2026
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight">
          Cabang Perlombaan
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Tantang potensi digital Anda melalui 4 cabang kompetisi resmi tingkat Mahasiswa dan Pelajar SMA/SMK se-wilayah Ciayumajakuning dan Nasional.
        </p>
      </div>

      {/* Target Level Tabs */}
      <div className="flex justify-center border-b border-gray-200">
        <div className="inline-flex p-1 bg-gray-100/80 rounded-xl space-x-1">
          <button
            onClick={() => { setTargetLevel('all'); setPage(1); }}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              targetLevel === 'all'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua Jenjang
          </button>
          <button
            onClick={() => { setTargetLevel('university'); setPage(1); }}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              targetLevel === 'university'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tingkat Mahasiswa
          </button>
          <button
            onClick={() => { setTargetLevel('high_school'); setPage(1); }}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              targetLevel === 'high_school'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tingkat SMA / SMK
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-semibold text-gray-400 mr-1">Kategori:</span>
          {[
            { id: 'all', label: 'Semua' },
            { id: 'ui_ux', label: 'UI/UX' },
            { id: 'web_development', label: 'Web Dev' },
            { id: 'lkti', label: 'LKTI' },
            { id: 'poster', label: 'Poster' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                category === cat.id
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari kompetisi..."
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <Button type="submit" size="sm" variant="primary">
            Cari
          </Button>
          {(search || category !== 'all' || targetLevel !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-gray-500 hover:text-brand-600 whitespace-nowrap px-1"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-gray-500">Memuat cabang kompetisi...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-200 p-6 max-w-md mx-auto">
          <p className="text-sm font-semibold text-red-700 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCompetitions}>
            Coba Lagi
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>Menampilkan <strong>{competitions.length}</strong> dari <strong>{totalCount}</strong> kompetisi yang tersedia</span>
          </div>

          <CompetitionGrid competitions={competitions} />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                &larr; Sebelumnya
              </Button>
              <span className="text-xs font-semibold text-gray-700 px-3">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya &rarr;
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionsPage;
