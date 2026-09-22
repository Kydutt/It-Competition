import React, { useState, useEffect, useCallback } from 'react';
import competitionService from '../../services/competitionService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const AdminCompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [targetLevel, setTargetLevel] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompetition, setCurrentCompetition] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTargetComp, setStatusTargetComp] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form Initial Data
  const defaultFormData = {
    name: '',
    slug: '',
    category: 'ui_ux',
    target_level: 'university',
    theme: '',
    description: '',
    registration_fee: 0,
    quota: 50,
    min_team_member: 1,
    max_team_member: 3,
    registration_start: '',
    registration_end: '',
    submission_start: '',
    submission_deadline: '',
    status: 'draft',
    is_published: false,
    guidebook_url: '',
    poster_url: '',
  };
  const [formData, setFormData] = useState(defaultFormData);

  // Allowed transitions map according to backend business rules
  const allowedTransitions = {
    draft: ['registration_open', 'archived'],
    registration_open: ['registration_closed', 'draft', 'archived'],
    registration_closed: ['submission_open', 'registration_open', 'archived'],
    submission_open: ['judging', 'registration_closed', 'archived'],
    judging: ['finished', 'submission_open', 'archived'],
    finished: ['archived'],
    archived: ['draft'],
  };

  const statusLabels = {
    draft: 'Draft',
    registration_open: 'Pendaftaran Dibuka',
    registration_closed: 'Pendaftaran Ditutup',
    submission_open: 'Pengumpulan Karya Dibuka',
    judging: 'Tahap Penjurian',
    finished: 'Selesai',
    archived: 'Diarsipkan',
  };

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (targetLevel) params.target_level = targetLevel;
      if (statusFilter) params.status = statusFilter;
      if (publishedFilter !== '') params.is_published = publishedFilter;

      const res = await competitionService.getAdminCompetitions(params);
      if (res.success && res.data) {
        const items = res.data.data || res.data;
        setCompetitions(items);
        if (res.data.meta) {
          setTotalPages(res.data.meta.last_page || 1);
          setTotalCount(res.data.meta.total || items.length);
        } else {
          setTotalPages(1);
          setTotalCount(items.length);
        }
      }
    } catch (err) {
      console.error('Failed to fetch competitions:', err);
      setError('Gagal memuat data kompetisi.');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, targetLevel, statusFilter, publishedFilter]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentCompetition(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (comp) => {
    setIsEditing(true);
    setCurrentCompetition(comp);
    setFormData({
      name: comp.name || '',
      slug: comp.slug || '',
      category: comp.category || 'ui_ux',
      target_level: comp.target_level || 'university',
      theme: comp.theme || '',
      description: comp.description || '',
      registration_fee: comp.registration_fee ?? 0,
      quota: comp.quota ?? 50,
      min_team_member: comp.min_team_member ?? 1,
      max_team_member: comp.max_team_member ?? 3,
      registration_start: comp.registration_start ? comp.registration_start.slice(0, 16) : '',
      registration_end: comp.registration_end ? comp.registration_end.slice(0, 16) : '',
      submission_start: comp.submission_start ? comp.submission_start.slice(0, 16) : '',
      submission_deadline: comp.submission_deadline ? comp.submission_deadline.slice(0, 16) : '',
      status: comp.status || 'draft',
      is_published: !!comp.is_published,
      guidebook_url: comp.guidebook_url || '',
      poster_url: comp.poster_url || '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        ...formData,
        registration_fee: parseInt(formData.registration_fee, 10) || 0,
        quota: parseInt(formData.quota, 10) || 50,
        min_team_member: parseInt(formData.min_team_member, 10) || 1,
        max_team_member: parseInt(formData.max_team_member, 10) || 3,
        registration_start: formData.registration_start || null,
        registration_end: formData.registration_end || null,
        submission_start: formData.submission_start || null,
        submission_deadline: formData.submission_deadline || null,
      };

      if (isEditing && currentCompetition) {
        await competitionService.updateCompetition(currentCompetition.id, payload);
        setSuccessMsg('Kompetisi berhasil diperbarui.');
      } else {
        await competitionService.createCompetition(payload);
        setSuccessMsg('Kompetisi baru berhasil dibuat.');
      }

      setShowFormModal(false);
      fetchCompetitions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving competition:', err);
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTogglePublish = async (comp) => {
    try {
      if (comp.is_published) {
        await competitionService.unpublishCompetition(comp.id);
        setSuccessMsg(`Kompetisi "${comp.name}" berhasil di-unpublish.`);
      } else {
        await competitionService.publishCompetition(comp.id);
        setSuccessMsg(`Kompetisi "${comp.name}" berhasil dipublikasikan.`);
      }
      fetchCompetitions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      setError('Gagal mengubah status publikasi kompetisi.');
    }
  };

  const openStatusModal = (comp) => {
    setStatusTargetComp(comp);
    setSelectedStatus('');
    setShowStatusModal(true);
  };

  const handleStatusChangeSubmit = async () => {
    if (!statusTargetComp || !selectedStatus) return;
    try {
      await competitionService.changeCompetitionStatus(statusTargetComp.id, selectedStatus);
      setSuccessMsg(`Status kompetisi "${statusTargetComp.name}" berhasil diubah.`);
      setShowStatusModal(false);
      fetchCompetitions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to change status:', err);
      setError(err.response?.data?.message || 'Gagal mengubah status kompetisi.');
    }
  };

  const handleDelete = async (comp) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus kompetisi "${comp.name}"? Jika kompetisi sudah memiliki data tim atau transaksi, silakan gunakan opsi Arsipkan.`
    );
    if (!confirmDelete) return;

    try {
      await competitionService.deleteCompetition(comp.id);
      setSuccessMsg(`Kompetisi "${comp.name}" berhasil dihapus.`);
      fetchCompetitions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to delete competition:', err);
      alert(err.response?.data?.message || err.response?.data?.errors?.competition?.[0] || 'Gagal menghapus kompetisi.');
    }
  };

  const handleArchive = async (comp) => {
    const confirmArchive = window.confirm(`Arsipkan kompetisi "${comp.name}"? Kompetisi ini tidak akan tampil secara publik.`);
    if (!confirmArchive) return;

    try {
      await competitionService.changeCompetitionStatus(comp.id, 'archived');
      setSuccessMsg(`Kompetisi "${comp.name}" berhasil diarsipkan.`);
      fetchCompetitions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to archive competition:', err);
      setError('Gagal mengarsipkan kompetisi.');
    }
  };

  const statusVariant = {
    registration_open: 'success',
    registration_closed: 'warning',
    submission_open: 'primary',
    judging: 'info',
    finished: 'default',
    draft: 'default',
    archived: 'default',
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Kelola Cabang Kompetisi</h2>
          <p className="text-sm text-gray-500">Manajemen cabang lomba, status lifecycle, dan publikasi sistem</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} className="font-semibold shadow-xs">
          + Tambah Kompetisi Baru
        </Button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold">&times;</button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 font-bold">&times;</button>
        </div>
      )}

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="sm:col-span-2 flex gap-2">
              <input
                type="text"
                placeholder="Cari nama atau slug..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <Button type="submit" size="sm" variant="secondary">Cari</Button>
            </form>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Semua Kategori</option>
              <option value="ui_ux">UI/UX</option>
              <option value="web_development">Web Development</option>
              <option value="lkti">LKTI</option>
              <option value="poster">Poster</option>
            </select>

            {/* Target Level */}
            <select
              value={targetLevel}
              onChange={(e) => { setTargetLevel(e.target.value); setPage(1); }}
              className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Semua Jenjang</option>
              <option value="university">Mahasiswa</option>
              <option value="high_school">SMA/SMK</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="registration_open">Pendaftaran Dibuka</option>
              <option value="registration_closed">Pendaftaran Ditutup</option>
              <option value="submission_open">Pengumpulan Karya</option>
              <option value="judging">Tahap Penjurian</option>
              <option value="finished">Selesai</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table Content */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Memuat data kompetisi...</p>
            </div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-16 p-4">
              <p className="text-gray-500 font-medium">Tidak ada data kompetisi yang sesuai filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Kompetisi</th>
                  <th className="px-4 py-3.5">Kategori & Jenjang</th>
                  <th className="px-4 py-3.5">Biaya & Format</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Publikasi</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {competitions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Name & Theme */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400 font-mono">/{c.slug}</div>
                      {c.theme && <div className="text-xs text-brand-600 italic truncate max-w-xs">{c.theme}</div>}
                    </td>

                    {/* Category & Level */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-800">{c.category_label || c.category}</div>
                      <div className="text-xs text-gray-500">{c.target_level_label || c.target_level}</div>
                    </td>

                    {/* Fee & Team */}
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      <div>Rp {c.registration_fee?.toLocaleString('id-ID')}</div>
                      <div>Tim: {c.min_team_member} - {c.max_team_member} org (Max: {c.quota})</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => openStatusModal(c)}
                        title="Klik untuk mengubah status"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Badge variant={statusVariant[c.status] || 'default'} className="font-semibold text-xs">
                          {c.status_label || c.status} &#x25BE;
                        </Badge>
                      </button>
                    </td>

                    {/* Published Toggle */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleTogglePublish(c)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${
                          c.is_published
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {c.is_published ? '✓ Published' : 'Draft / Off'}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <Button variant="secondary" size="sm" onClick={() => openEditModal(c)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleArchive(c)} title="Arsipkan">
                        Arsip
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(c)}
                        className="text-red-600 hover:bg-red-50 hover:border-red-200"
                        title="Hapus"
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <span>Total {totalCount} data</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <span className="px-2 py-1 font-semibold">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create & Edit Competition Form */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Cabang Kompetisi' : 'Tambah Cabang Kompetisi Baru'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nama Kompetisi *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                    placeholder="Contoh: UI/UX Competition"
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Slug (Opsional)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-xs"
                    placeholder="Auto generate dari nama jika kosong"
                  />
                  {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    <option value="ui_ux">UI/UX Competition</option>
                    <option value="web_development">Web Development</option>
                    <option value="lkti">LKTI (Karya Tulis Ilmiah)</option>
                    <option value="poster">Poster Competition</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Jenjang Sasaran *</label>
                  <select
                    value={formData.target_level}
                    onChange={(e) => setFormData({ ...formData, target_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    <option value="university">Mahasiswa (Perguruan Tinggi)</option>
                    <option value="high_school">Siswa (SMA/SMK/Sederajat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tema Kompetisi</label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  placeholder="Contoh: Akselerasi Transformasi Digital UMKM"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Deskripsi Lengkap *</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  placeholder="Rincian deskripsi mengenai cabang perlombaan ini..."
                ></textarea>
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description[0]}</p>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Biaya (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.registration_fee}
                    onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  {formErrors.registration_fee && <p className="text-red-500 text-xs mt-1">{formErrors.registration_fee[0]}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kuota Tim *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  {formErrors.quota && <p className="text-red-500 text-xs mt-1">{formErrors.quota[0]}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Min Anggota *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.min_team_member}
                    onChange={(e) => setFormData({ ...formData, min_team_member: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  {formErrors.min_team_member && <p className="text-red-500 text-xs mt-1">{formErrors.min_team_member[0]}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Max Anggota *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.max_team_member}
                    onChange={(e) => setFormData({ ...formData, max_team_member: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  {formErrors.max_team_member && <p className="text-red-500 text-xs mt-1">{formErrors.max_team_member[0]}</p>}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Mulai Pendaftaran</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_start}
                    onChange={(e) => setFormData({ ...formData, registration_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Akhir Pendaftaran</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_end}
                    onChange={(e) => setFormData({ ...formData, registration_end: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  {formErrors.registration_end && <p className="text-red-500 text-xs mt-1">{formErrors.registration_end[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Mulai Pengumpulan Karya</label>
                  <input
                    type="datetime-local"
                    value={formData.submission_start}
                    onChange={(e) => setFormData({ ...formData, submission_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Deadline Pengumpulan Karya</label>
                  <input
                    type="datetime-local"
                    value={formData.submission_deadline}
                    onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  {formErrors.submission_deadline && <p className="text-red-500 text-xs mt-1">{formErrors.submission_deadline[0]}</p>}
                </div>
              </div>

              {/* Status & Publication */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status Awal</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    <option value="draft">Draft</option>
                    <option value="registration_open">Pendaftaran Dibuka</option>
                    <option value="registration_closed">Pendaftaran Ditutup</option>
                    <option value="submission_open">Pengumpulan Karya Dibuka</option>
                    <option value="judging">Tahap Penjurian</option>
                    <option value="finished">Selesai</option>
                    <option value="archived">Diarsipkan</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded text-brand-600 w-4 h-4"
                  />
                  <label htmlFor="is_published" className="font-semibold text-gray-800">
                    Publikasikan ke Website Umum (is_published)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Kompetisi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Status */}
      {showStatusModal && statusTargetComp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Ubah Status Kompetisi</h3>
            <p className="text-xs text-gray-600">
              Kompetisi: <strong>{statusTargetComp.name}</strong><br />
              Status saat ini: <Badge variant="primary" className="ml-1">{statusTargetComp.status_label || statusTargetComp.status}</Badge>
            </p>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-gray-700">Pilih Status Baru (Sesuai Aturan Alur):</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
              >
                <option value="">-- Pilih Transisi Status --</option>
                {(allowedTransitions[statusTargetComp.status] || []).map((st) => (
                  <option key={st} value={st}>
                    {statusLabels[st] || st}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400">
                Hanya transisi status yang valid menurut alur lifecycle kompetisi yang dapat dipilih.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button size="sm" variant="outline" onClick={() => setShowStatusModal(false)}>
                Batal
              </Button>
              <Button size="sm" variant="primary" disabled={!selectedStatus} onClick={handleStatusChangeSubmit}>
                Terapkan Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompetitionsPage;
