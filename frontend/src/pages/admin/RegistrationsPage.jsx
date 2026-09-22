import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const AdminRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters & search
  const [search, setSearch] = useState('');
  const [selectedComp, setSelectedComp] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');
  const [page, setPage] = useState(1);

  // Action Modals
  const [rejectModal, setRejectModal] = useState({ open: false, reg: null, reason: '' });
  const [revisionModal, setRevisionModal] = useState({ open: false, reg: null, note: '' });
  const [detailModal, setDetailModal] = useState({ open: false, reg: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompetitions = async () => {
    try {
      const res = await api.get('/competitions');
      if (res.data?.success) {
        const raw = res.data.data;
        const items = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];
        setCompetitions(items);
      }
    } catch (err) {
      console.error('Failed to load competitions:', err);
      setCompetitions([]);
    }
  };

  const fetchRegistrations = async (pageToFetch = page) => {
    try {
      setLoading(true);
      const params = {
        page: pageToFetch,
        per_page: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedComp) params.competition_id = selectedComp;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedEducation) params.education_level = selectedEducation;

      const res = await registrationService.getAdminRegistrations(params);
      if (res?.data) {
        const raw = res.data;
        const regItems = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];
        setRegistrations(regItems);
        if (raw?.meta) {
          setPagination({
            current_page: raw.meta.current_page || 1,
            last_page: raw.meta.last_page || 1,
            total: raw.meta.total || regItems.length,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load admin registrations:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    fetchRegistrations(1);
    setPage(1);
  }, [selectedComp, selectedStatus, selectedEducation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRegistrations(1);
    setPage(1);
  };

  const handleApprove = async (reg) => {
    if (!window.confirm(`Setujui pendaftaran ${reg.registration_number} (${reg.competition?.title || 'Kompetisi'})?`)) return;

    try {
      setActionLoading(true);
      setAlert(null);
      await registrationService.approveRegistration(reg.id);
      setAlert({ type: 'success', message: `Pendaftaran ${reg.registration_number} berhasil disetujui!` });
      await fetchRegistrations(page);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyetujui pendaftaran.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason.trim()) return;

    try {
      setActionLoading(true);
      setAlert(null);
      await registrationService.rejectRegistration(rejectModal.reg.id, rejectModal.reason.trim());
      setAlert({ type: 'info', message: `Pendaftaran ${rejectModal.reg.registration_number} telah ditolak.` });
      setRejectModal({ open: false, reg: null, reason: '' });
      await fetchRegistrations(page);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menolak pendaftaran.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevisionSubmit = async (e) => {
    e.preventDefault();
    if (!revisionModal.note.trim()) return;

    try {
      setActionLoading(true);
      setAlert(null);
      await registrationService.requestRevision(revisionModal.reg.id, revisionModal.note.trim());
      setAlert({ type: 'info', message: `Permintaan revisi untuk ${revisionModal.reg.registration_number} berhasil dikirim ke peserta.` });
      setRevisionModal({ open: false, reg: null, note: '' });
      await fetchRegistrations(page);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal meminta revisi.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'revision_required':
        return <Badge variant="warning">Revisi Diminta</Badge>;
      case 'under_review':
        return <Badge variant="warning">Sedang Ditinjau</Badge>;
      case 'submitted':
        return <Badge variant="info">Perlu Verifikasi</Badge>;
      case 'cancelled':
        return <Badge variant="default">Dibatalkan</Badge>;
      case 'draft':
      default:
        return <Badge variant="default">Draf</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Verifikasi & Manajemen Pendaftaran</h2>
          <p className="text-sm text-gray-500">Tinjau keabsahan berkas administratif pendaftaran tim dan peserta individu</p>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* FILTER & SEARCH BAR */}
      <Card className="border border-gray-200">
        <CardContent className="p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Cari no. pendaftaran, nama peserta, email, atau nama tim..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Cari Data
            </Button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-xs">
            <div>
              <label className="block text-gray-500 mb-1 font-semibold">Cabang Kompetisi</label>
              <select
                value={selectedComp}
                onChange={(e) => setSelectedComp(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-xs"
              >
                <option value="">Semua Cabang Lomba</option>
                {(Array.isArray(competitions) ? competitions : []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-500 mb-1 font-semibold">Status Pendaftaran</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-xs"
              >
                <option value="">Semua Status</option>
                <option value="submitted">Perlu Verifikasi (Submitted)</option>
                <option value="approved">Disetujui (Approved)</option>
                <option value="revision_required">Perlu Revisi (Revision)</option>
                <option value="rejected">Ditolak (Rejected)</option>
                <option value="draft">Draf (Draft)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 mb-1 font-semibold">Jenjang Pendidikan</label>
              <select
                value={selectedEducation}
                onChange={(e) => setSelectedEducation(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-xs"
              >
                <option value="">Semua Jenjang</option>
                <option value="university">Mahasiswa (University)</option>
                <option value="high_school">SMA/SMK (High School)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REJECT MODAL */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Tolak Pendaftaran</h3>
            <p className="text-xs text-gray-600">
              Tuliskan alasan penolakan berkas pendaftaran{' '}
              <strong className="text-gray-900">{rejectModal.reg?.registration_number}</strong>.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alasan Penolakan (Wajib Diisi):
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="Contoh: Berkas identitas tidak sah, melewati batas kuota, dll..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectModal({ open: false, reg: null, reason: '' })}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={actionLoading || !rejectModal.reason.trim()}
                >
                  {actionLoading ? 'Memproses...' : 'Tolak Pendaftaran'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVISION MODAL */}
      {revisionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Minta Revisi Berkas</h3>
            <p className="text-xs text-gray-600">
              Berikan catatan perbaikan kepada peserta{' '}
              <strong className="text-gray-900">{revisionModal.reg?.registration_number}</strong>.
            </p>

            <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan Revisi untuk Peserta (Wajib Diisi):
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionModal.note}
                  onChange={(e) => setRevisionModal({ ...revisionModal, note: e.target.value })}
                  placeholder="Contoh: Mohon upload ulang foto KTM yang lebih jelas, atau perbaiki nama anggota tim..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRevisionModal({ open: false, reg: null, note: '' })}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading || !revisionModal.note.trim()}
                >
                  {actionLoading ? 'Memproses...' : 'Kirim Permintaan Revisi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL AUDIT MODAL */}
      {detailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono font-bold text-brand-700 text-xs">
                  {detailModal.reg?.registration_number}
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  {detailModal.reg?.competition?.title || detailModal.reg?.competition?.name}
                </h3>
              </div>
              <div>{getStatusBadge(detailModal.reg?.status)}</div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-gray-400 block">Pendaftar / Penanggung Jawab:</span>
                  <span className="font-bold text-gray-900">{detailModal.reg?.user?.name}</span>
                  <div className="text-gray-500">{detailModal.reg?.user?.email}</div>
                  <div className="text-gray-500">{detailModal.reg?.user?.phone || '-'}</div>
                </div>
                <div>
                  <span className="text-gray-400 block">Instansi & Jenjang:</span>
                  <span className="font-semibold text-gray-800">{detailModal.reg?.user?.institution || '-'}</span>
                  <div className="uppercase font-bold text-gray-400 text-[10px] mt-0.5">
                    {detailModal.reg?.user?.education_level || '-'}
                  </div>
                </div>
              </div>

              {detailModal.reg?.team && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">
                      Tim: {detailModal.reg.team.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Kode: {detailModal.reg.team.code}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-600 block">Anggota Tim:</span>
                    {(Array.isArray(detailModal.reg?.team?.members) ? detailModal.reg.team.members : []).map((m) => (
                      <div key={m.id} className="flex justify-between items-center text-gray-600 pl-2">
                        <span>• {m.name} ({m.email})</span>
                        <Badge variant={m.role === 'leader' ? 'success' : 'default'}>{m.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailModal.reg?.revision_note && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
                  <strong className="block">Catatan Permintaan Revisi:</strong>
                  <p>{detailModal.reg.revision_note}</p>
                </div>
              )}

              {detailModal.reg?.rejection_reason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900">
                  <strong className="block">Alasan Penolakan:</strong>
                  <p>{detailModal.reg.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDetailModal({ open: false, reg: null })}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE DATA */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat berkas pendaftaran...</p>
        </div>
      ) : (Array.isArray(registrations) ? registrations : []).length === 0 ? (
        <Card>
          <div className="text-center py-14 text-gray-500 text-sm">
            Tidak ada data pendaftaran yang sesuai dengan filter pencarian.
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">No. Registrasi</th>
                  <th className="py-3 px-4 font-semibold">Cabang Kompetisi</th>
                  <th className="py-3 px-4 font-semibold">Peserta / Tim</th>
                  <th className="py-3 px-4 font-semibold">Instansi / Jenjang</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(Array.isArray(registrations) ? registrations : []).map((r) => {
                  const isSubmitted = r.status === 'submitted';
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {r.registration_number}
                        <div className="text-[10px] text-gray-400 font-sans font-normal">
                          {new Date(r.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{r.competition?.title || r.competition?.name}</div>
                        <span className="text-[10px] text-gray-400">
                          {r.competition?.competition_type === 'team' ? 'Tim' : 'Individu'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {r.team ? (
                          <div>
                            <span className="font-bold text-gray-900">{r.team.name}</span>
                            <div className="text-[11px] text-gray-500">
                              Ketua: {r.user?.name} ({r.team.members?.length || 1} org)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-gray-900">{r.user?.name}</span>
                            <div className="text-[11px] text-gray-500">{r.user?.email}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <div>{r.user?.institution || '-'}</div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {r.user?.education_level || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => setDetailModal({ open: true, reg: r })}
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[11px]"
                          >
                            Detail
                          </button>

                          {isSubmitted && (
                            <>
                              <button
                                onClick={() => handleApprove(r)}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => setRevisionModal({ open: true, reg: r, note: '' })}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium text-[11px]"
                              >
                                Revisi
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, reg: r, reason: '' })}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px]"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {pagination.last_page > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div>
                Halaman {pagination.current_page} dari {pagination.last_page} ({pagination.total} data)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.current_page <= 1}
                  onClick={() => {
                    const prev = pagination.current_page - 1;
                    setPage(prev);
                    fetchRegistrations(prev);
                  }}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => {
                    const next = pagination.current_page + 1;
                    setPage(next);
                    fetchRegistrations(next);
                  }}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminRegistrationsPage;
