import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const AdminParticipantsPage = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const fetchParticipants = useCallback(async (targetPage = page, searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: targetPage,
        per_page: 15,
      };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await api.get('/admin/participants', { params });
      if (res.data?.success) {
        const rawData = res.data.data;
        const items = Array.isArray(rawData?.data)
          ? rawData.data
          : Array.isArray(rawData)
          ? rawData
          : [];
        setParticipants(items);

        if (rawData?.meta) {
          setPagination({
            current_page: rawData.meta.current_page || 1,
            last_page: rawData.meta.last_page || 1,
            total: rawData.meta.total || items.length,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load participants:', err);
      setError(err.response?.data?.message || 'Gagal memuat data peserta.');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchParticipants(page, search);
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchParticipants(1, search);
  };

  const participantList = Array.isArray(participants) ? participants : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Daftar Peserta & Akun</h2>
          <p className="text-sm text-gray-500">Kelola akun ketua tim dan peserta terdaftar dalam kompetisi</p>
        </div>
        <div className="text-xs text-gray-500 font-semibold bg-white px-3 py-2 rounded-lg border border-gray-200">
          Total Terdaftar: <span className="text-brand-600 font-bold">{pagination.total} Peserta</span>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* SEARCH BAR */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Cari berdasarkan nama, email, atau asal institusi/sekolah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Cari Peserta
            </Button>
            {search && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  fetchParticipants(1, '');
                }}
              >
                Reset
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* TABLE / LIST */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat data peserta...</p>
        </div>
      ) : participantList.length === 0 ? (
        <Card>
          <div className="text-center py-14 space-y-2">
            <div className="text-3xl">👥</div>
            <h3 className="text-base font-bold text-gray-900">Tidak Ada Peserta Ditemukan</h3>
            <p className="text-xs text-gray-500">
              {search ? 'Tidak ada peserta yang cocok dengan kata kunci pencarian.' : 'Belum ada akun peserta yang terdaftar.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Email & Kontak</th>
                  <th className="p-4">Institusi / Sekolah</th>
                  <th className="p-4">Jenjang</th>
                  <th className="p-4">Peran</th>
                  <th className="p-4">Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participantList.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">ID #{p.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900 font-medium">{p.email}</div>
                      <div className="text-xs text-gray-500">{p.phone || '-'}</div>
                    </td>
                    <td className="p-4 text-gray-700 font-medium">
                      {p.institution || '-'}
                    </td>
                    <td className="p-4">
                      <Badge variant="default" className="capitalize text-xs">
                        {p.education_level || '-'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="primary" className="uppercase text-[10px] font-bold">
                        {p.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {pagination.last_page > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
              <div>
                Halaman <span className="font-bold text-gray-900">{pagination.current_page}</span> dari{' '}
                <span className="font-bold text-gray-900">{pagination.last_page}</span> ({pagination.total} peserta)
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pagination.current_page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  &larr; Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.last_page))}
                >
                  Berikutnya &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminParticipantsPage;
