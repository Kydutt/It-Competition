import React, { useState, useEffect } from 'react';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const AdminRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const fetchRegistrations = async () => {
    try {
      const res = await registrationService.getAdminRegistrations();
      if (res.success && res.data) {
        setRegistrations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      const res = await registrationService.verifyRegistration(id, { status, notes: 'Diverifikasi oleh panitia' });
      if (res.success) {
        setMsg(`Pendaftaran #${id} berhasil diubah menjadi ${status}`);
        fetchRegistrations();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal memverifikasi');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Verifikasi Pendaftaran</h2>
        <p className="text-sm text-gray-500">Tinjau dan verifikasi kelayakan administrasi berkas peserta</p>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat berkas pendaftaran...</p>
        </div>
      ) : registrations.length === 0 ? (
        <Card><div className="text-center py-12 text-gray-500">Tidak ada pendaftaran yang perlu ditinjau saat ini.</div></Card>
      ) : (
        <div className="space-y-4">
          {registrations.map(r => (
            <Card key={r.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-gray-400 font-bold block">No. {r.registration_number}</span>
                  <CardTitle>{r.competition?.name}</CardTitle>
                </div>
                <Badge variant={r.status === 'APPROVED' ? 'success' : 'warning'}>{r.status}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Ketua: <strong>{r.user?.name}</strong> ({r.user?.email})</p>
                  <p>Tim: <strong>{r.team?.name}</strong></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleVerify(r.id, 'APPROVED')}>
                    Setujui (Approve)
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleVerify(r.id, 'REJECTED')}>
                    Tolak (Reject)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationsPage;
