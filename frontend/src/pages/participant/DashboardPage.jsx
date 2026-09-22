import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-orange-600 to-amber-500 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <Badge variant="default" className="bg-white/20 text-white border-white/30 text-xs">
            Portal Peserta HIMATIF ITC 2026
          </Badge>
          <h1 className="text-3xl font-black tracking-tight">
            Selamat Datang, {user?.name || 'Peserta'}!
          </h1>
          <p className="text-sm text-orange-100 leading-relaxed">
            Institusi: <strong>{user?.institution || 'Belum diisi'}</strong> • Wilayah Ciayumajakuning
          </p>
        </div>
      </div>

      {/* Progress Stepper Guide */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-gray-900">Alur Partisipasi Kompetisi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
            <span className="font-bold text-brand-600 block mb-1">Langkah 1</span>
            <p className="font-semibold text-gray-900">Pembentukan Tim</p>
            <p className="text-gray-500 mt-1">Daftarkan tim & undang anggota tim Anda.</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
            <span className="font-bold text-brand-600 block mb-1">Langkah 2</span>
            <p className="font-semibold text-gray-900">Pendaftaran Lomba</p>
            <p className="text-gray-500 mt-1">Pilih cabang kompetisi mahasiswa/siswa.</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
            <span className="font-bold text-brand-600 block mb-1">Langkah 3</span>
            <p className="font-semibold text-gray-900">Pembayaran</p>
            <p className="text-gray-500 mt-1">Transfer & unggah bukti verifikasi panitia.</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
            <span className="font-bold text-brand-600 block mb-1">Langkah 4</span>
            <p className="font-semibold text-gray-900">Unggah Karya</p>
            <p className="text-gray-500 mt-1">Kirim submission karya sebelum deadline.</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover>
          <CardHeader>
            <CardTitle>Tim Anda</CardTitle>
            <CardDescription>Kelola data anggota dan ketua tim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-600">Pastikan seluruh data anggota tim telah dilengkapi untuk verifikasi.</p>
            <Link to="/my-team" className="block">
              <Button variant="secondary" size="sm" className="w-full">
                Kelola Tim &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle>Pendaftaran Lomba</CardTitle>
            <CardDescription>Status registrasi dan berkas administrasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-600">Cek status peninjauan dan konfirmasi berkas oleh panitia.</p>
            <Link to="/registrations" className="block">
              <Button variant="secondary" size="sm" className="w-full">
                Lihat Pendaftaran &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle>Pengumpulan Karya</CardTitle>
            <CardDescription>Unggah submission dokumen dan link demo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-600">Kirimkan proposal LKTI, desain UI/UX, atau kode repositori.</p>
            <Link to="/submissions" className="block">
              <Button variant="primary" size="sm" className="w-full font-bold">
                Buka Pengumpulan &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
