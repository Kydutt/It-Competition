import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const RegistrationPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [copied, setCopied] = useState('');

  // Proof upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BCA');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const regRes = await registrationService.getRegistration(id);
      if (regRes.success && regRes.data) {
        setRegistration(regRes.data);
        if (regRes.data.payment) {
          setPayment(regRes.data.payment);
          if (regRes.data.payment.payment_method) setPaymentMethod(regRes.data.payment.payment_method);
          if (regRes.data.payment.transaction_reference) setTransactionRef(regRes.data.payment.transaction_reference);
        }
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal memuat informasi pendaftaran.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setAlert({ type: 'danger', message: 'Ukuran berkas melebihi batas maksimum 2MB.' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    setAlert(null);

    try {
      setUploading(true);

      // Step 1: ensure payment record exists
      let currentPayment = payment;
      if (!currentPayment) {
        const createRes = await paymentService.createPayment({
          registration_id: registration.id,
          payment_method: paymentMethod,
          transaction_reference: transactionRef || undefined,
          notes: notes || undefined,
        });
        currentPayment = createRes.data;
        setPayment(currentPayment);
      }

      // Step 2: if file selected, upload proof
      if (selectedFile) {
        const formData = new FormData();
        formData.append('proof', selectedFile);
        const uploadRes = await paymentService.uploadProof(currentPayment.id, formData);
        setPayment(uploadRes.data);
        setSelectedFile(null);
      }

      setAlert({ type: 'success', message: 'Bukti pembayaran berhasil diunggah! Klik tombol konfirmasi di bawah untuk mengirim ke panitia.' });
      loadData();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!payment) return;
    try {
      setSubmitting(true);
      const res = await paymentService.submitPayment(payment.id);
      setPayment(res.data);
      setAlert({ type: 'success', message: 'Pembayaran Anda berhasil dikirim dan kini sedang ditinjau oleh panitia.' });
      loadData();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal mengirim pembayaran untuk verifikasi.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadProof = async () => {
    if (!payment) return;
    try {
      const blob = await paymentService.downloadProof(payment.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bukti-transfer-${registration.registration_number}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Gagal mengunduh bukti transfer.' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Memuat rincian pembayaran pendaftaran...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">Pendaftaran tidak ditemukan atau Anda tidak memiliki akses.</Alert>
        <Button variant="secondary" onClick={() => navigate('/registrations')}>
          ← Kembali ke Pendaftaran
        </Button>
      </div>
    );
  }

  const isFree = Number(registration.competition?.registration_fee || 0) === 0;
  const isApproved = registration.status === 'approved';
  const paymentStatus = payment?.status;

  const canUploadProof = !isFree && (!paymentStatus || ['pending', 'rejected'].includes(paymentStatus));
  const canSubmitForReview = !isFree && payment && payment.has_proof && ['pending', 'rejected'].includes(paymentStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* NAVIGATION BREADCRUMB */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Link to="/registrations" className="hover:text-brand-600">Pendaftaran</Link>
          <span>/</span>
          <span className="text-gray-900">Pembayaran #{registration.registration_number}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/registrations')}>
          ← Kembali
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* REGISTRATION HEADER CARD */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {registration.registration_number}
                </span>
                <Badge variant={registration.status === 'approved' ? 'success' : 'warning'}>
                  {registration.status_label || registration.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-black text-gray-950 tracking-tight">
                {registration.competition?.title || registration.competition?.name}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Pendaftar: <strong className="text-gray-800">{registration.user?.name}</strong>
                {registration.team && (
                  <span> • Tim: <strong className="text-brand-600">{registration.team.name}</strong></span>
                )}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-gray-200 sm:pl-6">
              <span className="text-xs text-gray-400 block font-medium">Biaya Registrasi</span>
              <span className="text-2xl font-black text-gray-950">
                {isFree ? (
                  <span className="text-emerald-600">GRATIS</span>
                ) : (
                  `Rp ${Number(registration.competition?.registration_fee).toLocaleString('id-ID')}`
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CASE 1: FREE COMPETITION */}
      {isFree && (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">Cabang Lomba Bebas Biaya Pendaftaran</h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Kompetisi ini diselenggarakan tanpa pungutan biaya pendaftaran. Setelah status berkas pendaftaran Anda disetujui oleh panitia, Anda langsung berhak melanjutkan ke tahap pengumpulan karya (submission).
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {isApproved ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/registrations/${registration.id}/submission`)}
                  className="font-bold shadow-md shadow-brand-500/20"
                >
                  Buka Halaman Pengumpulan Karya (Submission) ➔
                </Button>
              ) : (
                <div className="text-xs text-gray-600 italic">
                  Menunggu verifikasi administrasi panitia sebelum tahap pengumpulan karya dibuka.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CASE 2: PAID COMPETITION */}
      {!isFree && (
        <div className="space-y-6">
          {/* REJECTION ALERT BANNER */}
          {paymentStatus === 'rejected' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-rose-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="text-base">✕</span> Bukti Pembayaran Ditolak oleh Panitia
              </div>
              <p className="text-xs leading-relaxed bg-white/70 p-3 rounded border border-rose-200">
                <strong>Alasan Penolakan:</strong> {payment.rejection_reason || 'Bukti transfer tidak terbaca atau nominal tidak sesuai.'}
              </p>
              <p className="text-xs text-rose-700">
                Silakan unggah kembali bukti transfer yang valid dan jelas di bawah ini, kemudian kirimkan ulang untuk peninjauan.
              </p>
            </div>
          )}

          {/* APPROVED BANNER */}
          {paymentStatus === 'approved' && (
            <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3 text-emerald-950">
              <div className="flex items-center gap-2.5 font-bold text-base">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                Pembayaran Anda Telah Disetujui!
              </div>
              <p className="text-xs leading-relaxed text-emerald-800">
                Terima kasih, pembayaran sebesar <strong>Rp {Number(payment.amount).toLocaleString('id-ID')}</strong> telah diverifikasi sah oleh panitia.
              </p>
              <div className="pt-1">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/registrations/${registration.id}/submission`)}
                  className="font-bold shadow-md shadow-brand-500/20"
                >
                  Lanjut ke Pengumpulan Karya (Submission) ➔
                </Button>
              </div>
            </div>
          )}

          {/* UNDER REVIEW BANNER */}
          {['submitted', 'under_review'].includes(paymentStatus) && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-blue-950">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="animate-spin text-brand-600">⏳</span> Bukti Pembayaran Sedang Ditinjau Panitia
              </div>
              <p className="text-xs leading-relaxed text-blue-800">
                Bukti transfer Anda telah masuk dalam antrean verifikasi tim bendahara panitia. Kami akan memverifikasi dalam waktu 1x24 jam kerja.
              </p>
            </div>
          )}

          {/* PAYMENT INSTRUCTIONS & BANK DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BANK ACCOUNT CARD */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Rekening Tujuan Transfer</span>
                  <Badge variant="info">Manual Bank Transfer</Badge>
                </CardTitle>
                <CardDescription>Kirim pembayaran tepat sesuai nominal yang tertera</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Bank Tujuan:</span>
                    <span className="text-sm font-bold text-gray-900">BANK CENTRAL ASIA (BCA)</span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Nomor Rekening:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono text-base font-black text-brand-600 tracking-wider">
                        1234567890
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('1234567890', 'rek')}
                        className="text-xs font-semibold px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 transition"
                      >
                        {copied === 'rek' ? 'Tersalin ✓' : 'Salin'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Atas Nama:</span>
                    <span className="text-sm font-bold text-gray-900">HIMATIF IT COMPETITION</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-400 block text-[11px]">Total Tagihan:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-lg font-black text-gray-950">
                        Rp {Number(registration.competition?.registration_fee).toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(String(registration.competition?.registration_fee), 'amount')}
                        className="text-xs font-semibold px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 transition"
                      >
                        {copied === 'amount' ? 'Tersalin ✓' : 'Salin'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>PENTING:</strong> Cantumkan nomor pendaftaran <code>{registration.registration_number}</code> pada berita transfer atau catatan transaksi bank Anda.
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT STATUS & UPLOAD SUMMARY */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Status Pembayaran</span>
                  <Badge
                    variant={
                      paymentStatus === 'approved'
                        ? 'success'
                        : paymentStatus === 'rejected'
                        ? 'danger'
                        : paymentStatus === 'submitted' || paymentStatus === 'under_review'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {payment?.status_label || (paymentStatus ? paymentStatus.toUpperCase() : 'BELUM DIBAYAR')}
                  </Badge>
                </CardTitle>
                <CardDescription>Informasi riwayat pengajuan bukti transfer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-gray-600">
                {payment ? (
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Metode Pembayaran:</span>
                      <span className="font-semibold text-gray-900">{payment.payment_method}</span>
                    </div>
                    {payment.transaction_reference && (
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">No. Referensi Bank:</span>
                        <span className="font-mono font-semibold text-gray-900">{payment.transaction_reference}</span>
                      </div>
                    )}
                    {payment.submitted_at && (
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">Tanggal Pengajuan:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(payment.submitted_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    {payment.reviewed_at && (
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">Waktu Verifikasi:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(payment.reviewed_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    {payment.has_proof && (
                      <div className="pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleDownloadProof}
                          className="w-full font-semibold flex items-center justify-center gap-1.5"
                        >
                          <span>🔍</span> Lihat / Unduh Bukti Transfer
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Belum ada data pembayaran yang dibuat. Silakan unggah bukti transfer Anda di bawah ini.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FORM UNGGAH BUKTI PEMBAYARAN */}
          {canUploadProof && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">
                  {paymentStatus === 'rejected' ? 'Unggah Ulang Bukti Transfer' : 'Form Unggah Bukti Transfer'}
                </CardTitle>
                <CardDescription>
                  Unggah file foto struk/screenshot mutasi transfer (Format JPG, PNG, atau PDF max 2MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUploadAndSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Metode Pembayaran"
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="Contoh: Transfer Bank BCA / QRIS"
                    />

                    <Input
                      label="Nomor Referensi Transaksi (Opsional)"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="Contoh: REF-2026-981240"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Catatan Pembayaran (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Keterangan tambahan jika diperlukan..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Berkas Bukti Transfer (JPG, PNG, PDF max 2MB) <span className="text-rose-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-brand-500 transition bg-gray-50/50">
                      <input
                        type="file"
                        id="proof-file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="proof-file" className="cursor-pointer block space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xl font-bold">
                          📤
                        </div>
                        {selectedFile ? (
                          <div>
                            <span className="text-sm font-bold text-gray-900 block">{selectedFile.name}</span>
                            <span className="text-xs text-gray-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti berkas
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-sm font-bold text-brand-600 hover:underline block">
                              Pilih berkas bukti transfer
                            </span>
                            <span className="text-xs text-gray-400">
                              Mendukung JPG, PNG, atau PDF hingga 2 MB
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={uploading || (!selectedFile && !payment)}
                      className="w-full sm:w-auto font-bold"
                    >
                      {uploading ? 'Mengunggah...' : 'Simpan Bukti Pembayaran'}
                    </Button>

                    {canSubmitForReview && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSubmitPayment}
                        disabled={submitting}
                        className="w-full sm:w-auto font-bold border-brand-600 text-brand-600 hover:bg-brand-50"
                      >
                        {submitting ? 'Mengirim...' : 'Kirimkan ke Panitia untuk Diverifikasi ➔'}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* SUBMIT BUTTON IF ALREADY UPLOADED PROOF BUT PENDING STATUS */}
          {canSubmitForReview && !canUploadProof && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-600">
                Bukti pembayaran telah disimpan. Klik tombol untuk mengajukan verifikasi ke panitia.
              </span>
              <Button
                variant="primary"
                onClick={handleSubmitPayment}
                disabled={submitting}
                className="font-bold"
              >
                {submitting ? 'Mengirim...' : 'Kirim Pembayaran untuk Diverifikasi ➔'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationPaymentPage;
