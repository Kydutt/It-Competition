import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const MyCompetitionsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await registrationService.getRegistrations();
        if (res.success && res.data) {
          setRegistrations(res.data);
        }
      } catch (err) {
        console.error('Failed to load my competitions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Kompetisi Saya</h2>
          <p className="text-sm text-gray-500">Daftar cabang lomba yang sedang atau telah Anda daftarkan</p>
        </div>
        <Link to="/competitions">
          <Button variant="primary" size="sm">
            + Daftar Cabang Lomba Baru
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat kompetisi terdaftar...</p>
        </div>
      ) : registrations.length === 0 ? (
        <Card>
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-500">Anda belum terdaftar dalam cabang lomba manapun.</p>
            <Link to="/competitions">
              <Button variant="primary" size="sm">
                Jelajahi & Daftar Lomba Sekarang
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map((reg) => (
            <Card key={reg.id}>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <Badge variant="primary" className="mb-2">
                    {reg.competition?.category || 'Kategori Lomba'}
                  </Badge>
                  <CardTitle>{reg.competition?.name || 'Kompetisi'}</CardTitle>
                </div>
                <Badge variant={reg.status === 'APPROVED' ? 'success' : 'warning'}>
                  {reg.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <p className="text-gray-400">Nomor Registrasi:</p>
                  <p className="font-bold text-gray-900">{reg.registration_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400">Nama Tim:</p>
                  <p className="font-semibold text-gray-900">{reg.team?.name || 'Belum terhubung'}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <Link to="/submissions" className="w-full">
                    <Button variant="secondary" size="sm" className="w-full">
                      Lihat Pengumpulan Karya
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCompetitionsPage;
