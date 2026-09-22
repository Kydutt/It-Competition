import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import competitionService from '../../services/competitionService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Selected payment
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofBlobUrl, setProofBlobUrl] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchCompetitions = async () => {
    try {
      const res = await competitionService.getAdminCompetitions({ per_page: 50 });
      if (res.success && res.data) {
        setCompetitions(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 15,
        status: statusFilter || undefined,
        competition_id: competitionFilter || undefined,
        search: searchQuery || undefined,
      };

      const res = await paymentService.getAdminPayments(params);
      if (res.success && res.data) {
        setPayments(res.data);
        if (res.meta) {
          setPagination({
            current_page: res.meta.current_page,
            last_page: res.meta.last_page,
            total: res.meta.total,
          });
        }
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal memuat daftar pembayaran.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    fetchPayments(1);
  }, [statusFilter, competitionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments(1);
  };

  const handleOpenProof = async (payment) => {
    setSelectedPayment(payment);
    setShowProofModal(true);
    setProofBlobUrl(null);
    setLoadingProof(true);

    try {
      const blob = await paymentService.downloadAdminProof(payment.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      setProofBlobUrl(url);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Gagal mengunduh berkas bukti transfer.' });
    } finally {
      setLoadingProof(false);
    }
  };

  const handleApprove = async (payment) => {
    if (!window.confirm(`Setujui pembayaran untuk registrasi ${payment.registration?.registration_number}? Status registrasi akan otomatis menjadi lunas.`)) {
      return;
    }

    try {
      setProcessingAction(true);
      await paymentService.approvePayment(payment.id);
      setAlert({ type: 'success', message: `Pembayaran #${payment.id} berhasil disetujui.` });
      fetchPayments(pagination.current_page);
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal menyetujui pembayaran.',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleOpenReject = (payment) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Wajib mengisi alasan penolakan.');
      return;
    }

    try {
      setProcessingAction(true);
      await paymentService.rejectPayment(selectedPayment.id, rejectReason.trim());
      setAlert({ type: 'info', message: `Pembayaran #${selectedPayment.id} telah ditolak dengan alasan yang tercatat.` });
      setShowRejectModal(false);
      fetchPayments(pagination.current_page);
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal menolak pembayaran.',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">DISETUJUI</Badge>;
      case 'rejected':
        return <Badge variant="danger">DITOLAK</Badge>;
      case 'submitted':
      case 'under_review':
        return <Badge variant="info">MENUNGGU VERIFIKASI</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">DIBATALKAN</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning">BELUM UPLOAD</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Verifikasi & Manajemen Pembayaran</h2>
          <p className="text-sm text-gray-500">
            Periksa keabsahan bukti transfer bank dan kelola status pembayaran pendaftaran
          </p>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* FILTERS & SEARCH */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status Pembayaran</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Status</option>
                <option value="under_review">Menunggu Verifikasi (Submitted/Review)</option>
                <option value="approved">Disetujui (Approved)</option>
                <option value="rejected">Ditolak (Rejected)</option>
                <option value="pending">Belum Bayar (Pending)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cabang Kompetisi</label>
              <select
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Cabang Lomba</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pencarian Peserta / No. Reg</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama, email, atau no. registrasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Cari
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TABLE DATA */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">No. Registrasi</th>
                <th className="p-4">Peserta / Tim</th>
                <th className="p-4">Cabang Lomba</th>
                <th className="p-4">Nominal</th>
                <th className="p-4">Bukti Transfer</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
                    Memuat data pembayaran...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400">
                    Tidak ditemukan data pembayaran sesuai filter.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const reg = p.registration;
                  const comp = reg?.competition;
                  const canAct = ['submitted', 'under_review'].includes(p.status);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-gray-900 block">
                          {reg?.registration_number || `REG-${p.registration_id}`}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {p.submitted_at ? new Date(p.submitted_at).toLocaleString('id-ID') : '-'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-gray-900 block">{p.user?.name || reg?.user?.name}</span>
                        <span className="text-gray-400 text-[11px] block">{p.user?.email || reg?.user?.email}</span>
                        {reg?.team && (
                          <span className="text-brand-600 font-medium text-[10px]">
                            Tim: {reg.team.name}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-gray-800 block">{comp?.title || comp?.name}</span>
                        <span className="text-[10px] text-gray-400">{p.payment_method || 'Bank Transfer'}</span>
                      </td>

                      <td className="p-4">
                        <span className="font-black text-gray-900 text-sm block">
                          Rp {Number(p.amount).toLocaleString('id-ID')}
                        </span>
                        {p.transaction_reference && (
                          <span className="font-mono text-[10px] text-gray-400 block">
                            Ref: {p.transaction_reference}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {p.has_proof ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenProof(p)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            🔍 Lihat Bukti
                          </Button>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Belum diunggah</span>
                        )}
                      </td>

                      <td className="p-4">
                        {getStatusBadge(p.status)}
                        {p.rejection_reason && (
                          <div className="text-[10px] text-rose-600 mt-1 line-clamp-1" title={p.rejection_reason}>
                            Alasan: {p.rejection_reason}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAct && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(p)}
                                disabled={processingAction}
                                className="font-bold text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                              >
                                Setujui ✓
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenReject(p)}
                                disabled={processingAction}
                                className="font-bold text-[11px] py-1 px-2.5"
                              >
                                Tolak ✕
                              </Button>
                            </>
                          )}
                          {!canAct && p.status === 'approved' && (
                            <span className="text-emerald-600 font-semibold text-[11px]">Terverifikasi</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.last_page > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Halaman {pagination.current_page} dari {pagination.last_page} (Total {pagination.total} pembayaran)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() => fetchPayments(pagination.current_page - 1)}
              >
                ← Sebelumnya
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchPayments(pagination.current_page + 1)}
              >
                Selanjutnya →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: PROOF PREVIEW MODAL */}
      {showProofModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Bukti Transfer Pembayaran</h3>
                <p className="text-xs text-gray-400">
                  {selectedPayment.registration?.registration_number} • Rp {Number(selectedPayment.amount).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="min-h-[250px] max-h-[400px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
              {loadingProof ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-gray-500">Mengambil berkas bukti...</span>
                </div>
              ) : proofBlobUrl ? (
                <img
                  src={proofBlobUrl}
                  alt="Bukti Transfer"
                  className="max-h-[380px] w-auto object-contain mx-auto"
                />
              ) : (
                <span className="text-xs text-gray-400">Berkas tidak dapat ditampilkan langsung.</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={proofBlobUrl}
                download={`bukti-transfer-${selectedPayment.id}.jpg`}
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
              >
                ⬇ Simpan ke Komputer
              </a>

              <div className="flex gap-2">
                {['submitted', 'under_review'].includes(selectedPayment.status) && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowProofModal(false);
                        handleApprove(selectedPayment);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                    >
                      Setujui Bukti
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setShowProofModal(false);
                        handleOpenReject(selectedPayment);
                      }}
                      className="font-bold"
                    >
                      Tolak
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" onClick={() => setShowProofModal(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT REASON MODAL */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-rose-950">Tolak Bukti Pembayaran</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tuliskan alasan penolakan secara jelas agar peserta dapat memahami kekurangan dan mengunggah ulang bukti transfer yang benar.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Nominal transfer tidak sesuai dengan biaya registrasi (kurang Rp 10.000). Silakan lakukan pelunasan..."
                  className="w-full text-xs rounded-lg border border-gray-300 p-3 bg-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={processingAction || !rejectReason.trim()}
                  className="font-bold"
                >
                  {processingAction ? 'Menyimpan...' : 'Konfirmasi Tolak Pembayaran'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
