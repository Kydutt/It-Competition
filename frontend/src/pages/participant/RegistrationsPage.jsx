import React, { useState, useEffect } from 'react';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export const RegistrationsPage = () => {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">APPROVED (Disetujui)</Badge>;
      case 'REJECTED': return <Badge variant="danger">REJECTED (Ditolak)</Badge>;
      case 'IN_REVIEW': return <Badge variant="warning">IN REVIEW (Sedang Ditinjau)</Badge>;
      case 'SUBMITTED': return <Badge variant="info">SUBMITTED (Diajukan)</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Status Pendaftaran</h2>
        <p className="text-sm text-gray-500">Pantau proses verifikasi berkas dan keabsahan pendaftaran kompetisi</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat status pendaftaran...</p>
        </div>
      ) : registrations.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Belum ada pendaftaran yang diajukan.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map(reg => (
            <Card key={reg.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-400 block">No. Pendaftaran: {reg.registration_number}</span>
                  <CardTitle className="mt-1">{reg.competition?.name || 'Kompetisi'}</CardTitle>
                </div>
                <div>{getStatusBadge(reg.status)}</div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-600">
                <p>Tim: <strong>{reg.team?.name}</strong></p>
                <p>Tanggal Pengajuan: <strong>{new Date(reg.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></p>
                {reg.verified_at && (
                  <p className="text-emerald-600 font-semibold">Diverifikasi pada: {new Date(reg.verified_at).toLocaleDateString('id-ID')}</p>
                )}
                {reg.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
                    <span className="font-semibold block text-gray-700">Catatan Panitia:</span>
                    <p className="text-gray-600">{reg.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationsPage;
