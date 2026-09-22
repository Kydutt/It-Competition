import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const fetchPayments = async () => {
    try {
      const res = await paymentService.getAdminPayments();
      if (res.success && res.data) {
        setPayments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      const res = await paymentService.verifyPayment(id, { status, notes: 'Diverifikasi oleh admin' });
      if (res.success) {
        setMsg(`Pembayaran #${id} berhasil diubah menjadi ${status}`);
        fetchPayments();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal memverifikasi');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Verifikasi Pembayaran</h2>
        <p className="text-sm text-gray-500">Periksa bukti transfer dan validasi pembayaran peserta</p>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat data pembayaran...</p>
        </div>
      ) : payments.length === 0 ? (
        <Card><div className="text-center py-12 text-gray-500">Belum ada pembayaran yang perlu ditinjau.</div></Card>
      ) : (
        <div className="space-y-4">
          {payments.map(p => (
            <Card key={p.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-gray-400 font-bold block">ID Pembayaran #{p.id}</span>
                  <CardTitle>Rp {p.amount?.toLocaleString('id-ID')}</CardTitle>
                </div>
                <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>{p.status}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Pengirim: <strong>{p.user?.name}</strong> ({p.user?.email})</p>
                  <p>Metode: {p.payment_method}</p>
                  {p.proof_url && (
                    <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-bold block">
                      🔍 Buka Bukti Transfer
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleVerify(p.id, 'PAID')}>
                    Konfirmasi Lunas (PAID)
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleVerify(p.id, 'PAYMENT_REJECTED')}>
                    Tolak Bukti
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

export default AdminPaymentsPage;
