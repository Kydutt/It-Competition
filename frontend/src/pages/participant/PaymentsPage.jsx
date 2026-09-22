import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    registration_id: '',
    amount: '',
    payment_method: 'Transfer Bank BCA',
    proof_url: '',
  });
  const [msg, setMsg] = useState(null);

  const fetchPayments = async () => {
    try {
      const res = await paymentService.getParticipantPayments();
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
    registrationService.getRegistrations().then(res => {
      if (res.success && res.data) setRegistrations(res.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await paymentService.submitPayment(formData);
      if (res.success) {
        setMsg('Bukti pembayaran berhasil dikirim!');
        setShowForm(false);
        fetchPayments();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal mengirim pembayaran');
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Riwayat & Konfirmasi Pembayaran</h2>
          <p className="text-sm text-gray-500">Unggah bukti transfer biaya pendaftaran kompetisi</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Batal' : '+ Unggah Bukti Pembayaran'}
        </Button>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Bukti Pembayaran</CardTitle>
            <CardDescription>Nomor Rekening Panitia: BCA 123-456-7890 a.n. HIMATIF Organizer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Pendaftaran Lomba</label>
                <select
                  required
                  value={formData.registration_id}
                  onChange={e => setFormData({ ...formData, registration_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Pilih Pendaftaran --</option>
                  {registrations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.registration_number} - {r.competition?.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Nominal Transfer (Rp)"
                type="number"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="75000"
              />

              <Input
                label="Metode Pembayaran"
                required
                value={formData.payment_method}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                placeholder="Transfer BCA / Mandiri / QRIS"
              />

              <Input
                label="Tautan Bukti Transfer (Image / Drive URL)"
                type="url"
                required
                value={formData.proof_url}
                onChange={e => setFormData({ ...formData, proof_url: e.target.value })}
                placeholder="https://drive.google.com/..."
              />

              <Button type="submit" variant="primary" className="font-bold">
                Kirim untuk Diverifikasi
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat riwayat pembayaran...</p>
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Belum ada riwayat pembayaran yang tercatat.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map(pay => (
            <Card key={pay.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-400 block">ID Pembayaran #{pay.id}</span>
                  <CardTitle className="text-lg mt-1">{formatRupiah(pay.amount)}</CardTitle>
                </div>
                <Badge variant={pay.status === 'PAID' ? 'success' : 'warning'}>
                  {pay.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-600">
                <p>Metode: <strong>{pay.payment_method}</strong></p>
                <p>Waktu Pengajuan: <strong>{new Date(pay.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></p>
                {pay.proof_url && (
                  <a href={pay.proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-semibold block mt-1">
                    🔍 Lihat Bukti Transfer
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
