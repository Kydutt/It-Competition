import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const RegistrationSubmissionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [savingWork, setSavingWork] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const regRes = await registrationService.getRegistration(id);
      if (regRes.success && regRes.data) {
        setRegistration(regRes.data);

        // Check if there is already a submission for this registration
        if (regRes.data.submission) {
          setSubmission(regRes.data.submission);
          setTitle(regRes.data.submission.title || '');
          setDescription(regRes.data.submission.description || '');
        } else {
          // Alternatively query participant submissions
          const subRes = await submissionService.getParticipantSubmissions();
          if (subRes.success && subRes.data) {
            const found = subRes.data.find((s) => s.registration_id === parseInt(id, 10));
            if (found) {
              setSubmission(found);
              setTitle(found.title || '');
              setDescription(found.description || '');
            }
          }
        }
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal memuat rincian pengumpulan karya.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setAlert(null);

    try {
      setSavingWork(true);
      if (!submission) {
        // Create initial submission draft
        const res = await submissionService.createSubmission({
          registration_id: registration.id,
          title,
          description,
        });
        setSubmission(res.data);
        setAlert({ type: 'success', message: 'Draf karya berhasil dibuat. Silakan unggah berkas pendukung Anda.' });
      } else {
        setAlert({ type: 'info', message: 'Rincian karya disimpan.' });
      }
      loadData();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal menyimpan rincian karya.',
      });
    } finally {
      setSavingWork(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      setAlert({ type: 'danger', message: 'Ukuran berkas melebihi batas maksimum 20MB.' });
      return;
    }

    try {
      setUploadingFile(true);
      setAlert(null);

      // Ensure submission exists first
      let currentSub = submission;
      if (!currentSub) {
        const createRes = await submissionService.createSubmission({
          registration_id: registration.id,
          title: title || `Karya ${registration.registration_number}`,
          description: description || '',
        });
        currentSub = createRes.data;
        setSubmission(currentSub);
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await submissionService.uploadFile(currentSub.id, formData);
      setSubmission(res.data);
      setSelectedFile(null);
      // Reset input element
      const fileInput = document.getElementById('sub-file-input');
      if (fileInput) fileInput.value = '';

      setAlert({ type: 'success', message: 'Berkas karya berhasil diunggah!' });
      loadData();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal mengunggah berkas.',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = async (fileId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus berkas ini?')) return;

    try {
      setAlert(null);
      const res = await submissionService.removeFile(submission.id, fileId);
      setSubmission(res.data);
      setAlert({ type: 'info', message: 'Berkas berhasil dihapus.' });
      loadData();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal menghapus berkas.',
      });
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const blob = await submissionService.downloadFile(submission.id, file.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Gagal mengunduh berkas.' });
    }
  };

  const handleFinalSubmit = async () => {
    if (!submission) return;
    if (!submission.files || submission.files.length === 0) {
      setAlert({ type: 'danger', message: 'Wajib mengunggah minimal 1 berkas sebelum melakukan submit karya.' });
      return;
    }

    if (!window.confirm('Kirimkan karya Anda untuk dinilai oleh dewan juri? Anda masih dapat memperbarui berkas sebelum batas waktu berakhir.')) {
      return;
    }

    try {
      setSubmittingFinal(true);
      setAlert(null);
      const res = await submissionService.submitSubmission(submission.id);
      setSubmission(res.data);
      setAlert({ type: 'success', message: 'Selamat! Karya Anda berhasil dikirimkan ke panitia.' });
      loadData();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal mengirimkan karya.',
      });
    } finally {
      setSubmittingFinal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Memuat portal pengumpulan karya...</p>
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

  // Verification checks
  const isApproved = registration.status === 'approved';
  const isPaymentCleared = registration.is_payment_cleared;
  const isEligible = isApproved && isPaymentCleared;

  // Deadline calculations
  const competition = registration.competition;
  const deadlineDate = competition?.submission_deadline ? new Date(competition.submission_deadline) : null;
  const isExpired = deadlineDate ? new Date() > deadlineDate : false;
  const isLocked = submission?.is_locked || isExpired;
  const canModify = !isLocked;

  const calculateTimeRemaining = () => {
    if (!deadlineDate) return null;
    const diff = deadlineDate.getTime() - new Date().getTime();
    if (diff <= 0) return 'Batas Waktu Telah Berakhir';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} Hari ${hours} Jam ${minutes} Menit`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* NAVIGATION BREADCRUMB */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Link to="/registrations" className="hover:text-brand-600">Pendaftaran</Link>
          <span>/</span>
          <span className="text-gray-900">Pengumpulan Karya #{registration.registration_number}</span>
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

      {/* HEADER CARD */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {registration.registration_number}
                </span>
                <Badge variant={registration.is_team_based ? 'info' : 'secondary'}>
                  {registration.is_team_based ? 'Kompetisi Tim' : 'Kompetisi Individu'}
                </Badge>
                {submission && (
                  <Badge variant={submission.status === 'submitted' ? 'success' : 'warning'}>
                    {submission.status_label || submission.status.toUpperCase()}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-black text-gray-950 tracking-tight">
                {competition?.title || competition?.name}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Pendaftar: <strong className="text-gray-800">{registration.user?.name}</strong>
                {registration.team && (
                  <span> • Tim: <strong className="text-brand-600">{registration.team.name}</strong></span>
                )}
              </p>
            </div>

            {/* DEADLINE BANNER */}
            <div className="text-right sm:border-l sm:border-gray-200 sm:pl-6 space-y-1">
              <span className="text-xs text-gray-400 block font-medium">Batas Akhir Pengumpulan:</span>
              <span className={`text-sm font-bold block ${isExpired ? 'text-rose-600' : 'text-gray-900'}`}>
                {deadlineDate ? deadlineDate.toLocaleDateString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : 'Tidak Ditentukan'}
              </span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}>
                ⏱ {calculateTimeRemaining()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INELIGIBILITY BLOCKER */}
      {!isEligible && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-950">Pendaftaran Belum Memenuhi Syarat Pengumpulan Karya</h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Untuk mengumpulkan karya pada kompetisi ini, pendaftaran administrasi Anda harus disetujui panitia dan biaya pendaftaran (bila berbayar) harus telah lunas diverifikasi.
                </p>
                <div className="pt-3 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/registrations/${registration.id}/payment`)}
                    className="font-bold"
                  >
                    Periksa Status Pembayaran ➔
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ELIGIBLE: SUBMISSION MANAGEMENT */}
      {isEligible && (
        <div className="space-y-6">
          {/* DEADLINE EXPIRED WARNING */}
          {isExpired && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-3 text-rose-900">
              <span className="text-xl">🔒</span>
              <div className="text-xs">
                <span className="font-bold block text-sm">Batas Waktu Pengumpulan Karya Telah Berakhir</span>
                Pengunggahan dan pengubahan berkas karya telah dikunci oleh sistem secara otomatis.
              </div>
            </div>
          )}

          {/* SUBMITTED SUCCESS BANNER */}
          {submission?.status === 'submitted' && !isExpired && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                Karya Berhasil Dikumpulkan
              </div>
              <p className="text-xs leading-relaxed text-emerald-800">
                Karya Anda telah diserahkan dan siap untuk dinilai oleh dewan juri. Selama belum melewati batas waktu deadline, Anda masih dapat memperbarui berkas jika diperlukan.
              </p>
            </div>
          )}

          {/* 1. WORK DETAILS (TITLE & DESCRIPTION) */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Informasi & Deskripsi Karya</CardTitle>
              <CardDescription>Berikan judul proyek dan ringkasan konsep karya Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <Input
                  label="Judul Karya / Proyek"
                  required
                  disabled={!canModify}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Aplikasi Smart Agrikultur Berbasis AI"
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Deskripsi / Abstrak Singkat Karya <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    disabled={!canModify}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan latar belakang, fitur utama, dan keunggulan solusi dari karya Anda..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {canModify && !submission && (
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={savingWork} className="font-bold">
                      {savingWork ? 'Menyimpan...' : 'Simpan Draf Karya ➔'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* 2. UPLOAD FILES SECTION */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Berkas Karya Terlampir</span>
                <span className="text-xs font-normal text-gray-500">
                  {submission?.files?.length || 0} berkas diunggah
                </span>
              </CardTitle>
              <CardDescription>
                Unggah dokumen proposal (PDF), source code (ZIP/RAR), presentasi (PPTX), atau berkas lainnya (Maks 20MB per berkas)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* UPLOAD ZONE */}
              {canModify && (
                <form onSubmit={handleFileUpload} className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-brand-500 transition bg-gray-50/40">
                    <input
                      type="file"
                      id="sub-file-input"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="sub-file-input" className="cursor-pointer block space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xl font-bold">
                        📁
                      </div>
                      {selectedFile ? (
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">{selectedFile.name}</span>
                          <span className="text-xs text-gray-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Klik tombol unggah di bawah
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm font-bold text-brand-600 hover:underline block">
                            Pilih berkas karya dari komputer
                          </span>
                          <span className="text-xs text-gray-400">
                            Mendukung ZIP, RAR, PDF, DOCX, PPTX hingga 20 MB
                          </span>
                        </div>
                      )}
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={uploadingFile}
                        className="font-bold"
                      >
                        {uploadingFile ? 'Mengunggah...' : `Unggah Berkas: ${selectedFile.name}`}
                      </Button>
                    </div>
                  )}
                </form>
              )}

              {/* ATTACHED FILES LIST */}
              {submission?.files && submission.files.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-700 block">Daftar Berkas Terunggah:</span>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                    {submission.files.map((f) => (
                      <div key={f.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50/60 transition text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📄</span>
                          <div>
                            <span className="font-bold text-gray-900 block">{f.original_name}</span>
                            <span className="text-gray-400 text-[11px]">
                              {f.formatted_size || `${(f.size / 1024).toFixed(1)} KB`} • Diunggah {new Date(f.created_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(f)}
                            className="px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded border border-brand-200 transition"
                          >
                            ⬇ Unduh
                          </button>

                          {canModify && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(f.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                            >
                              ✕ Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs border border-gray-100 rounded-xl bg-gray-50/50">
                  Belum ada berkas yang diunggah. Silakan pilih dan unggah berkas karya Anda di atas.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. FINAL SUBMISSION ACTION BAR */}
          {canModify && submission && (
            <div className="p-5 bg-white border border-brand-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-gray-600">
                <span className="font-bold text-gray-900 block text-sm">Siap untuk Mengirimkan Karya?</span>
                Pastikan seluruh berkas telah lengkap. Anda masih dapat melakukan resubmission hingga waktu deadline berakhir.
              </div>

              <Button
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={submittingFinal || !submission?.files?.length}
                className="font-bold shadow-md shadow-brand-500/20 shrink-0"
              >
                {submittingFinal ? 'Memproses...' : 'Kirimkan Karya Sekarang 🚀'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationSubmissionPage;
