import React, { useState, useEffect } from 'react';
import submissionService from '../../services/submissionService';
import competitionService from '../../services/competitionService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const AdminSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [competitionFilter, setCompetitionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  const fetchCompetitions = async () => {
    try {
      const res = await competitionService.getAdminCompetitions({ per_page: 50 });
      if (res?.success) {
        const raw = res.data;
        const items = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];
        setCompetitions(items);
      }
    } catch (err) {
      console.error(err);
      setCompetitions([]);
    }
  };

  const fetchSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 15,
        competition_id: competitionFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      };

      const res = await submissionService.getAdminSubmissions(params);
      if (res?.success) {
        const raw = res.data;
        const subItems = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];
        setSubmissions(subItems);
        const meta = raw?.meta || res.meta;
        if (meta) {
          setPagination({
            current_page: meta.current_page || 1,
            last_page: meta.last_page || 1,
            total: meta.total || subItems.length,
          });
        }
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal memuat daftar karya masuk.',
      });
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    fetchSubmissions(1);
  }, [competitionFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubmissions(1);
  };

  const handleDownloadFile = async (submissionId, file) => {
    try {
      setDownloadingFileId(file.id);
      const blob = await submissionService.downloadAdminFile(submissionId, file.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setAlert({ type: 'danger', message: `Gagal mengunduh berkas ${file.original_name}.` });
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Karya Masuk Peserta (Submissions)</h2>
          <p className="text-sm text-gray-500">
            Daftar karya lomba, dokumen proposal, source code, dan berkas lampiran peserta
          </p>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* FILTERS */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cabang Kompetisi</label>
              <select
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status Karya</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Status</option>
                <option value="submitted">Terkumpul (Submitted)</option>
                <option value="locked">Terkunci (Locked)</option>
                <option value="draft">Draf (Draft)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pencarian Judul / Peserta / Reg</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik judul karya, nama peserta, atau no. registrasi..."
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

      {/* TABLE */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">No. Registrasi</th>
                <th className="p-4">Peserta / Tim</th>
                <th className="p-4">Cabang Lomba</th>
                <th className="p-4">Judul Karya</th>
                <th className="p-4">Berkas Lampiran</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
                    Memuat daftar karya...
                  </td>
                </tr>
              ) : (Array.isArray(submissions) ? submissions : []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400">
                    Belum ada karya yang diunggah peserta.
                  </td>
                </tr>
              ) : (
                (Array.isArray(submissions) ? submissions : []).map((s) => {
                  const reg = s.registration;
                  const comp = s.competition || reg?.competition;
                  const filesCount = s.files?.length || 0;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-gray-900 block">
                          {reg?.registration_number || `REG-${s.registration_id}`}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {s.submitted_at ? new Date(s.submitted_at).toLocaleString('id-ID') : '-'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-gray-900 block">
                          {s.team?.name ? `Tim ${s.team.name}` : (reg?.user?.name || '-')}
                        </span>
                        {reg?.user?.institution && (
                          <span className="text-gray-400 text-[11px] block">{reg.user.institution}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-gray-800 block">{comp?.title || comp?.name}</span>
                        <span className="text-[10px] text-gray-400">
                          {comp?.category_label || comp?.category}
                        </span>
                      </td>

                      <td className="p-4 max-w-xs">
                        <span className="font-bold text-gray-900 block truncate" title={s.title}>
                          {s.title}
                        </span>
                        {s.description && (
                          <span className="text-gray-400 text-[11px] block line-clamp-1" title={s.description}>
                            {s.description}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md font-semibold text-gray-700">
                          📁 {filesCount} Berkas
                        </span>
                      </td>

                      <td className="p-4">
                        <Badge variant={s.status === 'submitted' ? 'success' : s.status === 'locked' ? 'secondary' : 'warning'}>
                          {s.status_label || s.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="p-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(s);
                            setShowDetailModal(true);
                          }}
                          className="font-semibold text-[11px]"
                        >
                          Lihat Rincian & Berkas
                        </Button>
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
              Halaman {pagination.current_page} dari {pagination.last_page} (Total {pagination.total} karya)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() => fetchSubmissions(pagination.current_page - 1)}
              >
                ← Sebelumnya
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchSubmissions(pagination.current_page + 1)}
              >
                Selanjutnya →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* SUBMISSION DETAIL MODAL */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-gray-400">
                  {selectedSubmission.registration?.registration_number}
                </span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {selectedSubmission.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[11px]">Entitas Peserta:</span>
                <span className="font-bold text-gray-900">
                  {selectedSubmission.team?.name ? `Tim ${selectedSubmission.team.name}` : (selectedSubmission.registration?.user?.name || '-')}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Cabang Kompetisi:</span>
                <span className="font-bold text-gray-900">
                  {selectedSubmission.competition?.title || selectedSubmission.competition?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Tanggal Pengumpulan:</span>
                <span className="font-bold text-gray-900">
                  {selectedSubmission.submitted_at
                    ? new Date(selectedSubmission.submitted_at).toLocaleString('id-ID')
                    : 'Belum submit final'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-700 block">Deskripsi / Abstrak Karya:</span>
              <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                {selectedSubmission.description || 'Tidak ada deskripsi yang dicantumkan.'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Berkas Karya Lampiran:</span>
                <span className="text-[11px] text-gray-400">
                  {selectedSubmission.files?.length || 0} berkas
                </span>
              </div>

              {selectedSubmission.files && selectedSubmission.files.length > 0 ? (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {selectedSubmission.files.map((file) => (
                    <div key={file.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50/60 transition text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <div>
                          <span className="font-bold text-gray-900 block">{file.original_name}</span>
                          <span className="text-gray-400 text-[11px]">
                            {file.formatted_size || `${(file.size / 1024).toFixed(1)} KB`} • Diunggah {new Date(file.created_at).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={downloadingFileId === file.id}
                        onClick={() => handleDownloadFile(selectedSubmission.id, file)}
                        className="font-bold text-[11px] border-brand-200 text-brand-600 hover:bg-brand-50"
                      >
                        {downloadingFileId === file.id ? 'Mengunduh...' : '⬇ Unduh Berkas'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                  Belum ada berkas yang diunggah.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button variant="secondary" size="sm" onClick={() => setShowDetailModal(false)}>
                Tutup Rincian
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubmissionsPage;
