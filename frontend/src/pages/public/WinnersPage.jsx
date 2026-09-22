import React, { useState, useEffect } from 'react';
import competitionService from '../../services/competitionService';

export const WinnersPage = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await competitionService.getWinners();
        if (res.success && res.data) {
          setWinners(res.data);
        }
      } catch (err) {
        console.error('Failed to load winners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-4xl font-black text-gray-950 tracking-tight">Hall of Fame & Juara</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Daftar pemenang resmi HIMATIF IT Competition se-wilayah Ciayumajakuning.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat data pemenang...</p>
        </div>
      ) : winners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <p className="text-gray-500 font-medium">Pengumuman pemenang edisi 2026 akan dipublikasikan setelah Grand Final.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {winners.map((winner) => (
            <div key={winner.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">{winner.award || 'Pemenang'}</span>
              <h3 className="text-xl font-bold text-gray-900">{winner.team?.name || 'Tim Juara'}</h3>
              <p className="text-sm text-gray-500">{winner.competition?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WinnersPage;
