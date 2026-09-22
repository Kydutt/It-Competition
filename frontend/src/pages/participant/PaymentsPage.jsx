import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await registrationService.getRegistrations();
      if (res?.success) {
        const raw = res.data;
        const items = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setRegistrations(items);
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal memuat riwayat pembayaran.',
      });
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const getPaymentBadge = (reg) => {
    const fee = Number(reg.competition?.registration_fee || 0);
    if (fee === 0) {
      return <Badge variant="success">GRATIS</Badge>;
    }

    const pay = reg.payment;
    if (!pay) {
      return <Badge variant="warning">BELUM DIBAYAR</Badge>;
    }

    switch (pay.status) {
      case 'approved':
        return <Badge variant="success">LUNAS / DISETUJUI</Badge>;
      case 'rejected':
        return <Badge variant="danger">PEMBAYARAN DITOLAK</Badge>;
      case 'submitted':
      case 'under_review':
        return <Badge variant="info">SEDANG DITINJAU</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">DIBATALKAN</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning">MENUNGGU PEMBAYARAN</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Status & Riwayat Pembayaran</h2>
          <p className="text-sm text-gray-500">Kelola konfirmasi transfer dan pantau status verifikasi biaya pendaftaran</p>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data pembayaran...</p>
        </div>
      ) : (Array.isArray(registrations) ? registrations : []).length === 0 ? (
        <Card>
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl">💳</span>
            <p className="text-gray-500 text-sm">Anda belum memiliki pendaftaran kompetisi.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/competitions')}>
              Jelajahi Kompetisi Sekarang
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {(Array.isArray(registrations) ? registrations : []).map((reg) => {
            const fee = Number(reg.competition?.registration_fee || 0);
            const isFree = fee === 0;
            const pay = reg.payment;

            return (
              <Card key={reg.id} className="overflow-hidden">
                <CardHeader className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">
                        {reg.registration_number}
                      </span>
                      {getPaymentBadge(reg)}
                    </div>
                    <CardTitle className="text-lg text-gray-900 mt-1">
                      {reg.competition?.title || reg.competition?.name}
                    </CardTitle>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-medium">Nominal Biaya</span>
                    <span className="text-lg font-black text-gray-950">
                      {isFree ? (
                        <span className="text-emerald-600">Bebas Biaya (Gratis)</span>
                      ) : (
                        `Rp ${fee.toLocaleString('id-ID')}`
                      )}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-3 text-xs">
                  {/* REJECTION REASON BANNER */}
                  {pay?.status === 'rejected' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                      <strong className="block text-xs">Alasan Penolakan dari Panitia:</strong>
                      <p>{pay.rejection_reason || 'Bukti transfer tidak valid atau nominal tidak sesuai.'}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Entitas:</span>
                      <span className="font-semibold text-gray-900">
                        {reg.team ? `Tim ${reg.team.name}` : 'Perorangan'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Metode / Status:</span>
                      <span className="font-semibold text-gray-900">
                        {isFree ? 'Tanpa Biaya' : pay?.payment_method || 'Transfer BCA'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Pembaruan Terakhir:</span>
                      <span className="font-semibold text-gray-900">
                        {pay?.updated_at
                          ? new Date(pay.updated_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                          : new Date(reg.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      variant={isFree || pay?.status === 'approved' ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => navigate(`/registrations/${reg.id}/payment`)}
                      className="font-bold"
                    >
                      {isFree
                        ? 'Lihat Rincian Biaya ➔'
                        : pay?.status === 'approved'
                        ? 'Lihat Bukti Terverifikasi ➔'
                        : pay?.status === 'rejected'
                        ? 'Unggah Ulang Bukti Transfer ➔'
                        : pay?.status === 'submitted' || pay?.status === 'under_review'
                        ? 'Pantau Status Verifikasi ➔'
                        : 'Lakukan Pembayaran Sekarang ➔'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
