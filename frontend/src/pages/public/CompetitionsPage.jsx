import React, { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Sparkles } from 'lucide-react';
import competitionService from '../../services/competitionService';
import CompetitionCard from '../../components/competition/CompetitionCard';
import Button from '../../components/ui/Button';
import SectionHeading from '../../components/ui/SectionHeading';
import { COMPETITIONS_DATA } from '../../data/festivalData';

export const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [targetLevel, setTargetLevel] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (targetLevel !== 'all') params.target_level = targetLevel;
      if (search.trim()) params.search = search.trim();

      const res = await competitionService.getCompetitions(params);
      if (res && res.success && res.data) {
        const items = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        if (items.length > 0) {
          setCompetitions(items);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      // Graceful fallback to local data
    }

    // Filter local COMPETITIONS_DATA
    let filtered = COMPETITIONS_DATA;
    if (targetLevel === 'mahasiswa') {
      filtered = filtered.filter(c => c.target_level === 'mahasiswa' || c.target_level === 'all');
    } else if (targetLevel === 'sma') {
      filtered = filtered.filter(c => c.target_level === 'sma' || c.target_level === 'all');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.category_label.toLowerCase().includes(q) || 
        c.shortDescription.toLowerCase().includes(q)
      );
    }

    setCompetitions(filtered);
    setLoading(false);
  }, [targetLevel, search]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setTargetLevel('all');
    setSearch('');
    setSearchInput('');
  };

  return (
    <div className="relative py-28 sm:py-32 bg-[#100B08] overflow-hidden min-h-screen">
      {/* Background Lighting */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle,rgba(255,106,0,0.1)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <SectionHeading
          badge="// COMPETITIONS // 2026"
          title="Katalog Cabang"
          highlight="Lomba Resmi"
          description="Eksplorasi seluruh cabang kompetisi teknologi informasi tingkat nasional untuk mahasiswa dan pelajar SMA/SMK sederajat."
        />

        {/* Filter & Search Bar */}
        <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Target Level Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-mono text-[#948277] mr-1 uppercase">Jenjang:</span>
            {[
              { id: 'all', label: 'Semua Jenjang' },
              { id: 'mahasiswa', label: 'Tingkat Mahasiswa' },
              { id: 'sma', label: 'Tingkat SMA/SMK' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTargetLevel(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  targetLevel === tab.id
                    ? 'bg-[#FF6A00] text-white shadow-orange-glow'
                    : 'bg-[#211811] text-[#C4B3A7] hover:text-[#FFF7F0] border border-[rgba(255,179,107,0.15)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#948277] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari cabang lomba..."
                className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.2)] text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]"
              />
            </div>
            <Button type="submit" size="sm" variant="primary">
              Cari
            </Button>
            {(search || targetLevel !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#FFB36B] hover:underline flex items-center gap-1"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

        </div>

        {/* Competitions Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#FF6A00]/20 border-t-[#FF6A00] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-mono text-[#FFB36B]">MEMUAT DATA KOMPETISI...</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-[#1C1410] border border-[rgba(255,179,107,0.15)] rounded-3xl p-8">
            <p className="text-lg font-bold font-display text-[#FFF7F0]">
              Tidak Ada Cabang Lomba yang Cocok
            </p>
            <p className="text-sm text-[#948277]">
              Coba sesuaikan kata kunci pencarian atau reset filter di atas.
            </p>
            <Button variant="secondary" onClick={handleResetFilters}>
              Reset Filter Pencarian
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {competitions.map((comp) => (
              <CompetitionCard key={comp.id || comp.slug} competition={comp} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default CompetitionsPage;
