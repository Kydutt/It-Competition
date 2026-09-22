import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-950 tracking-tight">Overview Dashboard Panitia</h1>
        <p className="text-sm text-gray-500">Statistik real-time peserta, pendaftaran, dan verifikasi HIMATIF IT Competition</p>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat statistik admin...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-0">
              <span className="text-xs text-gray-500 uppercase font-semibold">Total Kompetisi</span>
              <p className="text-3xl font-black text-gray-950 mt-1">{stats?.total_competitions ?? 4}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <span className="text-xs text-gray-500 uppercase font-semibold">Total Pendaftar</span>
              <p className="text-3xl font-black text-brand-600 mt-1">{stats?.total_registrations ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <span className="text-xs text-gray-500 uppercase font-semibold">Pending Verifikasi</span>
              <p className="text-3xl font-black text-amber-500 mt-1">{stats?.pending_verification ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <span className="text-xs text-gray-500 uppercase font-semibold">Total Submissions</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{stats?.total_submissions ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle>Kelola Cabang Lomba</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-600">Tambah, edit kuota, atau ubah status publikasi cabang kompetisi.</p>
            <Link to="/admin/competitions" className="block">
              <Button variant="secondary" size="sm" className="w-full">
                Buka Manajemen Lomba &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle>Verifikasi Pendaftaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-600">Tinjau kelayakan berkas persyaratan administrasi peserta.</p>
            <Link to="/admin/registrations" className="block">
              <Button variant="secondary" size="sm" className="w-full">
                Tinjau Pendaftaran &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle>Verifikasi Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-600">Cek mutasi dan konfirmasi status pembayaran biaya registrasi.</p>
            <Link to="/admin/payments" className="block">
              <Button variant="primary" size="sm" className="w-full font-bold">
                Tinjau Pembayaran &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
