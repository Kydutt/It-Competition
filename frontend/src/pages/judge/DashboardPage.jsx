import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const JudgeDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/judge/dashboard')
      .then(res => {
        if (res.data?.success) setStats(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-8 text-white shadow-md">
        <h1 className="text-3xl font-black tracking-tight">
          Selamat Bertugas, {user?.name || 'Dewan Juri'}
        </h1>
        <p className="text-sm text-amber-100 mt-2">
          Portal Penilaian Karya HIMATIF IT Competition 2026 • Wilayah Ciayumajakuning
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat dashboard juri...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-0">
              <span className="text-xs text-gray-500 uppercase font-semibold">Total Karya Menunggu Penilaian</span>
              <p className="text-3xl font-black text-amber-600 mt-1">{stats?.pending_judging ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <span className="text-xs text-gray-500 uppercase font-semibold">Karya Telah Dinilai</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{stats?.scored_count ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle>Daftar Karya Peserta (Submissions)</CardTitle>
            <CardDescription>Buka karya untuk melihat demo, dokumen, dan memberikan skor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-600">Evaluasi karya sesuai rubrik kriteria dan berikan catatan evaluasi konstruktif.</p>
            <Link to="/judge/submissions" className="block">
              <Button variant="primary" size="sm" className="w-full font-bold">
                Mulai Menilai Karya &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle>Rekap Nilai</CardTitle>
            <CardDescription>Tinjau skor yang telah Anda masukkan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-600">Periksa konsistensi penilaian sebelum penetapan pemenang akhir.</p>
            <Link to="/judge/scores" className="block">
              <Button variant="secondary" size="sm" className="w-full font-semibold">
                Lihat Rekap Nilai &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JudgeDashboardPage;
