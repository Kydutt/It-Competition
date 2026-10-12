import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  MapPin, 
  CheckCircle2,
  Tag
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import SearchInput from '../../components/dashboard/SearchInput';
import FilterControl from '../../components/dashboard/FilterControl';
import StatusBadge from '../../components/dashboard/StatusBadge';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import Button from '../../components/ui/Button';

export const AdminSchedulePage = () => {
  const [schedules, setSchedules] = useState(() => mockService.schedules);
  const [competitions] = useState(() => mockService.competitions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, schId: null, schTitle: '' });

  // Form State
  const defaultForm = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 WIB',
    competitionId: 'all',
    competitionName: 'Semua Cabang',
    location: 'Main Stage / Zoom Room 1',
    status: 'upcoming',
  };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'upcoming', label: 'Akan Datang' },
    { value: 'ongoing', label: 'Sedang Berlangsung' },
    { value: 'completed', label: 'Selesai' },
  ];

  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const matchSearch =
        search === '' ||
        sch.title.toLowerCase().includes(search.toLowerCase()) ||
        sch.description?.toLowerCase().includes(search.toLowerCase()) ||
        sch.location?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || sch.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [schedules, search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData(defaultForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch) => {
    setEditingSchedule(sch);
    setFormData({
      id: sch.id,
      title: sch.title || '',
      description: sch.description || '',
      date: sch.date || '',
      time: sch.time || '09:00 WIB',
      competitionId: sch.competitionId || 'all',
      competitionName: sch.competitionName || 'Semua Cabang',
      location: sch.location || '',
      status: sch.status || 'upcoming',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Judul agenda wajib diisi';
    if (!formData.date) errs.date = 'Tanggal wajib ditentukan';
    if (!formData.time.trim()) errs.time = 'Waktu pelaksanaan wajib diisi';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    let compName = 'Semua Cabang';
    if (formData.competitionId !== 'all') {
      const matched = competitions.find((c) => c.id === formData.competitionId);
      if (matched) compName = matched.name;
    }

    mockService.createOrUpdateSchedule({
      ...formData,
      competitionName: compName,
    });

    setSchedules([...mockService.schedules]);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!confirmDelete.schId) return;
    const idx = mockService.schedules.findIndex((s) => s.id === confirmDelete.schId);
    if (idx !== -1) {
      mockService.schedules.splice(idx, 1);
      mockService.saveState();
      setSchedules([...mockService.schedules]);
    }
    setConfirmDelete({ isOpen: false, schId: null, schTitle: '' });
  };

  const columns = [
    {
      header: 'Waktu & Tanggal',
      accessor: 'date',
      render: (row) => (
        <div className="flex items-start space-x-2">
          <CalendarIcon className="w-4 h-4 text-[#FF6A00] mt-0.5" />
          <div>
            <span className="font-bold font-mono text-sm text-[#FFF7F0] block">
              {new Date(row.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-xs font-mono text-[#FFB36B]">{row.time}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Agenda / Milestone',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold font-display text-[#FFF7F0] text-sm block">
            {row.title}
          </span>
          <p className="text-xs text-[#948277] line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      header: 'Terkait Cabang',
      accessor: 'competitionName',
      render: (row) => (
        <span className="text-xs font-mono text-[#C4B3A7] px-2 py-0.5 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.14)]">
          {row.competitionName}
        </span>
      ),
    },
    {
      header: 'Lokasi / Media',
      accessor: 'location',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-xs text-[#C4B3A7]">
          <MapPin className="w-3.5 h-3.5 text-[#FFB36B]" />
          <span>{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Aksi',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Agenda"
            className="p-1.5 rounded-lg text-[#FFB36B] hover:text-[#FF6A00] hover:bg-[#2A1D15] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setConfirmDelete({
                isOpen: true,
                schId: row.id,
                schTitle: row.title,
              })
            }
            title="Hapus Agenda"
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
        title="Jadwal & Milestone Acara"
        description="Kelola lini masa kompetisi, batas pengumpulan karya, sesi penjurian, dan pengumuman juara."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Jadwal', to: '/admin/schedule' },
        ]}
        actions={
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl">
        <div className="md:col-span-8">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama agenda, lokasi, atau deskripsi..."
          />
        </div>
        <div className="md:col-span-4">
          <FilterControl
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Schedules Table */}
      <DataTable
        columns={columns}
        data={filteredSchedules}
        keyExtractor={(item) => item.id}
        emptyMessage="Tidak ada agenda yang sesuai dengan filter pencarian."
      />

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 my-8 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
                  {editingSchedule ? 'Edit Agenda Acara' : 'Tambah Agenda Acara Baru'}
                </h3>
                <p className="text-xs text-[#948277]">
                  Jadwalkan milestone penting untuk peserta dan panitia.
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
                  Judul Agenda *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Technical Meeting & QnA"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
                {formErrors.title && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Deskripsi Kegiatan
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan detail petunjuk kehadiran agenda..."
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                  {formErrors.date && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Waktu *
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="09:00 - 12:00 WIB"
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Terkait Cabang Lomba
                  </label>
                  <select
                    value={formData.competitionId}
                    onChange={(e) => setFormData({ ...formData, competitionId: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="all">Semua Cabang Lomba</option>
                    {competitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Status Agenda
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="upcoming">Akan Datang</option>
                    <option value="ongoing">Sedang Berlangsung</option>
                    <option value="completed">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Lokasi / Tautan Platform
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Contoh: Zoom Meeting / Gedung Auditorium Lt. 3"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
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
                  {editingSchedule ? 'Simpan Perubahan' : 'Buat Agenda'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Hapus Agenda?"
        message={`Apakah Anda yakin ingin menghapus "${confirmDelete.schTitle}" dari lini masa acara?`}
        confirmLabel="Hapus Agenda"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, schId: null, schTitle: '' })}
      />
    </div>
  );
};

export default AdminSchedulePage;
