import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Edit3, 
  Trash2, 
  Pin, 
  Send, 
  Users, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import SearchInput from '../../components/dashboard/SearchInput';
import FilterControl from '../../components/dashboard/FilterControl';
import StatusBadge from '../../components/dashboard/StatusBadge';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import Button from '../../components/ui/Button';

export const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState(() => mockService.announcements);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnc, setEditingAnc] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, ancId: null, ancTitle: '' });

  // Form State
  const defaultForm = {
    title: '',
    body: '',
    audience: 'all',
    status: 'published',
    isPinned: false,
  };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  const audienceOptions = [
    { value: 'all', label: 'Semua Audiens' },
    { value: 'participants', label: 'Khusus Peserta' },
    { value: 'judges', label: 'Khusus Dewan Juri' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'published', label: 'Terbit' },
    { value: 'draft', label: 'Draft' },
  ];

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((anc) => {
      const matchSearch =
        search === '' ||
        anc.title.toLowerCase().includes(search.toLowerCase()) ||
        anc.body.toLowerCase().includes(search.toLowerCase());

      const matchAudience = audienceFilter === 'all' || anc.audience === audienceFilter;
      const matchStatus = statusFilter === 'all' || anc.status === statusFilter;

      return matchSearch && matchAudience && matchStatus;
    });
  }, [announcements, search, audienceFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingAnc(null);
    setFormData(defaultForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (anc) => {
    setEditingAnc(anc);
    setFormData({
      id: anc.id,
      title: anc.title || '',
      body: anc.body || '',
      audience: anc.audience || 'all',
      status: anc.status || 'published',
      isPinned: !!anc.isPinned,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Judul pengumuman wajib diisi';
    if (!formData.body.trim()) errs.body = 'Isi pesan pengumuman wajib diisi';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    mockService.createOrUpdateAnnouncement(formData);
    setAnnouncements([...mockService.announcements]);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!confirmDelete.ancId) return;
    const idx = mockService.announcements.findIndex((a) => a.id === confirmDelete.ancId);
    if (idx !== -1) {
      mockService.announcements.splice(idx, 1);
      mockService.saveState();
      setAnnouncements([...mockService.announcements]);
    }
    setConfirmDelete({ isOpen: false, ancId: null, ancTitle: '' });
  };

  const columns = [
    {
      header: 'Judul & Pesan',
      accessor: 'title',
      render: (row) => (
        <div>
          <div className="flex items-center space-x-2">
            {row.isPinned && (
              <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/30 font-bold">
                <Pin className="w-3 h-3 rotate-45" />
                <span>PINNED</span>
              </span>
            )}
            <span className="font-bold font-display text-[#FFF7F0] text-sm">{row.title}</span>
          </div>
          <p className="text-xs text-[#948277] mt-1 line-clamp-1">{row.body}</p>
        </div>
      ),
    },
    {
      header: 'Target Audiens',
      accessor: 'audience',
      render: (row) => {
        const labels = {
          all: 'Semua (Publik)',
          participants: 'Peserta Saja',
          judges: 'Dewan Juri',
        };
        return (
          <span className="text-xs font-mono text-[#FFB36B] px-2.5 py-1 rounded-lg bg-[#2A1D15] border border-[rgba(255,179,107,0.14)]">
            {labels[row.audience] || row.audience}
          </span>
        );
      },
    },
    {
      header: 'Status Publikasi',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} label={row.status === 'published' ? 'Dipublikasikan' : 'Draft'} />,
    },
    {
      header: 'Aksi',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Pengumuman"
            className="p-1.5 rounded-lg text-[#FFB36B] hover:text-[#FF6A00] hover:bg-[#2A1D15] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setConfirmDelete({
                isOpen: true,
                ancId: row.id,
                ancTitle: row.title,
              })
            }
            title="Hapus Pengumuman"
            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengumuman & Notifikasi Broadcast"
        description="Publikasikan informasi resmi, rilis berkas panduan, dan broadcast pengumuman babak final."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Pengumuman', to: '/admin/announcements' },
        ]}
        actions={
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengumuman</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl">
        <div className="md:col-span-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari isi atau judul pengumuman..."
          />
        </div>
        <div className="md:col-span-3">
          <FilterControl
            value={audienceFilter}
            onChange={setAudienceFilter}
            options={audienceOptions}
          />
        </div>
        <div className="md:col-span-3">
          <FilterControl
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Announcements Table */}
      <DataTable
        columns={columns}
        data={filteredAnnouncements}
        keyExtractor={(item) => item.id}
        emptyMessage="Tidak ada pengumuman yang sesuai dengan filter."
      />

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 my-8 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
                  {editingAnc ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h3>
                <p className="text-xs text-[#948277]">
                  Pemberitahuan akan disiarkan ke dashboard audiens yang dipilih.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#948277] hover:text-[#FFF7F0] p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Perpanjangan Deadline Pengumpulan Proposal"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
                {formErrors.title && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Isi Pengumuman Lengkap *
                </label>
                <textarea
                  rows={4}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Tuliskan detail pengumuman yang ingin disampaikan..."
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
                {formErrors.body && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.body}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Target Audiens
                  </label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="all">Semua Audiens</option>
                    <option value="participants">Khusus Peserta</option>
                    <option value="judges">Khusus Dewan Juri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Status Publikasi
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="published">Langsung Terbitkan</option>
                    <option value="draft">Simpan sebagai Draft</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#1C1410] border border-[rgba(255,179,107,0.14)] rounded-xl">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded border-[#FFB36B]/30 bg-[#100B08] text-[#FF6A00] focus:ring-[#FF6A00]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#FFF7F0] block">Sematkan di Atas (Pin Announcement)</span>
                    <span className="text-[11px] text-[#948277]">Pengumuman ini akan diprioritaskan di dashboard peserta.</span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-[rgba(255,179,107,0.14)] flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  {editingAnc ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Hapus Pengumuman?"
        message={`Apakah Anda yakin ingin menghapus "${confirmDelete.ancTitle}"? Pengumuman tidak lagi terlihat oleh audiens.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, ancId: null, ancTitle: '' })}
      />
    </div>
  );
};

export default AdminAnnouncementsPage;
