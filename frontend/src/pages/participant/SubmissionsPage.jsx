import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const SubmissionsPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await registrationService.getRegistrations();
      if (res.success && res.data) {
        setRegistrations(res.data);
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal memuat riwayat pengumpulan karya.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Pengumpulan Karya (Submissions)</h2>
          <p className="text-sm text-gray-500">
            Unggah dokumen proposal, source code, materi presentasi, atau berkas karya sebelum tenggat waktu
          </p>
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
          <p className="text-sm text-gray-500">Memuat data pengumpulan karya...</p>
        </div>
      ) : registrations.length === 0 ? (
        <Card>
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl">📁</span>
            <p className="text-gray-500 text-sm">Belum ada pendaftaran kompetisi aktif.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/competitions')}>
              Daftar Kompetisi Sekarang
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const comp = reg.competition;
            const sub = reg.submission;
            const deadline = comp?.submission_deadline ? new Date(comp.submission_deadline) : null;
            const isExpired = deadline ? new Date() > deadline : false;
            const isEligible = reg.is_eligible_for_submission;

            return (
              <Card key={reg.id} className="overflow-hidden">
                <CardHeader className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">
                        {reg.registration_number}
                      </span>
                      {sub ? (
                        <Badge variant={sub.status === 'submitted' ? 'success' : 'warning'}>
                          {sub.status === 'submitted' ? 'KARYA TERKUMPUL' : sub.status.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">BELUM DIKUMPULKAN</Badge>
                      )}
                      {isExpired && <Badge variant="danger">DEADLINE BERAKHIR</Badge>}
                    </div>

                    <CardTitle className="text-lg text-gray-900 mt-1">
                      {comp?.title || comp?.name}
                    </CardTitle>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-medium">Batas Akhir (Deadline)</span>
                    <span className={`text-xs font-bold block ${isExpired ? 'text-rose-600' : 'text-gray-900'}`}>
                      {deadline ? deadline.toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Belum ditentukan'}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-3 text-xs">
                  {sub ? (
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-sm">{sub.title}</span>
                        <span className="text-gray-400 text-[11px]">
                          {sub.files?.length || 0} Berkas Terlampir
                        </span>
                      </div>
                      {sub.description && (
                        <p className="text-gray-600 line-clamp-2 text-xs leading-relaxed">
                          {sub.description}
                        </p>
                      )}
                      {sub.submitted_at && (
                        <span className="text-emerald-700 text-[11px] font-medium block">
                          ✓ Terakhir disubmit: {new Date(sub.submitted_at).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-500 text-xs">
                      {isEligible
                        ? 'Anda telah memenuhi syarat! Silakan unggah berkas karya sebelum batas waktu deadline.'
                        : 'Syarat belum terpenuhi. Pendaftaran harus berstatus disetujui dan biaya pendaftaran telah lunas.'}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    {isEligible ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/registrations/${reg.id}/submission`)}
                        className="font-bold"
                      >
                        {sub?.status === 'submitted'
                          ? 'Kelola / Perbarui Berkas Karya ➔'
                          : 'Kumpulkan Karya Sekarang ➔'}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/registrations/${reg.id}/payment`)}
                      >
                        Selesaikan Pembayaran & Pendaftaran ➔
                      </Button>
                    )}
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

export default SubmissionsPage;
