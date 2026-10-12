import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  BookOpen, 
  Mail, 
  Building2,
  Sparkles
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import SearchInput from '../../components/dashboard/SearchInput';
import FilterControl from '../../components/dashboard/FilterControl';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import Button from '../../components/ui/Button';

export const AdminJudgesPage = () => {
  const [judges, setJudges] = useState(() => mockService.judges);
  const [competitions] = useState(() => mockService.competitions);
  const [search, setSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, judgeId: null, judgeName: '' });

  // Form State
  const defaultForm = {
    name: '',
    email: '',
    institution: '',
    specialization: '',
    assignedCompetitions: [],
  };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  const filterOptions = [
    { value: 'all', label: 'Semua Status Tugas' },
    { value: 'assigned', label: 'Memiliki Penugasan' },
    { value: 'unassigned', label: 'Belum Ditugaskan' },
  ];

  const filteredJudges = useMemo(() => {
    return judges.filter((judge) => {
      const matchSearch =
        search === '' ||
        judge.name.toLowerCase().includes(search.toLowerCase()) ||
        judge.email.toLowerCase().includes(search.toLowerCase()) ||
        judge.institution?.toLowerCase().includes(search.toLowerCase()) ||
        judge.specialization?.toLowerCase().includes(search.toLowerCase());

      const hasAssignment = judge.assignedCompetitions && judge.assignedCompetitions.length > 0;
      const matchAssignment =
        assignmentFilter === 'all' ||
        (assignmentFilter === 'assigned' && hasAssignment) ||
        (assignmentFilter === 'unassigned' && !hasAssignment);

      return matchSearch && matchAssignment;
    });
  }, [judges, search, assignmentFilter]);

  const handleOpenAdd = () => {
    setEditingJudge(null);
    setFormData(defaultForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (judge) => {
    setEditingJudge(judge);
    setFormData({
      id: judge.id,
      name: judge.name || '',
      email: judge.email || '',
      institution: judge.institution || '',
      specialization: judge.specialization || '',
      assignedCompetitions: judge.assignedCompetitions || [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleToggleCompetition = (compId) => {
    setFormData((prev) => {
      const exists = prev.assignedCompetitions.includes(compId);
      const updated = exists
        ? prev.assignedCompetitions.filter((id) => id !== compId)
        : [...prev.assignedCompetitions, compId];
      return { ...prev, assignedCompetitions: updated };
    });
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nama dewan juri wajib diisi';
    if (!formData.email.trim()) {
      errs.email = 'Email dewan juri wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Format email tidak valid';
    }
    if (!formData.specialization.trim()) {
      errs.specialization = 'Bidang kepakaran wajib diisi';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    mockService.createOrUpdateJudge(formData);
    setJudges([...mockService.judges]);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!confirmDelete.judgeId) return;
    const idx = mockService.judges.findIndex((j) => j.id === confirmDelete.judgeId);
    if (idx !== -1) {
      mockService.judges.splice(idx, 1);
      mockService.saveState();
      setJudges([...mockService.judges]);
    }
    setConfirmDelete({ isOpen: false, judgeId: null, judgeName: '' });
  };

  const columns = [
    {
      header: 'Profil Juri',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#2A1D15] border border-[rgba(255,179,107,0.2)] flex items-center justify-center font-bold text-sm text-[#FFB36B]">
            {row.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold font-display text-[#FFF7F0] text-sm block">{row.name}</span>
            <span className="text-xs text-[#948277] flex items-center space-x-1">
              <Mail className="w-3 h-3 text-[#FFB36B]" />
              <span>{row.email}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Institusi & Keahlian',
      accessor: 'institution',
      render: (row) => (
        <div>
          <span className="text-xs text-[#FFF7F0] font-medium block">{row.institution || 'Praktisi'}</span>
          <span className="text-[11px] font-mono text-[#FFB36B]">{row.specialization}</span>
        </div>
      ),
    },
    {
      header: 'Lomba Ditugaskan',
      accessor: 'assignedCompetitions',
      render: (row) => {
        const assigned = competitions.filter((c) =>
          row.assignedCompetitions?.includes(c.id)
        );
        if (assigned.length === 0) {
          return (
            <span className="text-xs font-mono text-[#948277] italic">
              Belum ada penugasan
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {assigned.map((c) => (
              <span
                key={c.id}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2A1D15] text-[#FFB36B] border border-[rgba(255,179,107,0.18)]"
              >
                {c.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Aksi',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Profil & Penugasan"
            className="p-1.5 rounded-lg text-[#FFB36B] hover:text-[#FF6A00] hover:bg-[#2A1D15] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setConfirmDelete({
                isOpen: true,
                judgeId: row.id,
                judgeName: row.name,
              })
            }
            title="Hapus Juri"
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
        title="Dewan Juri & Penugasan"
        description="Kelola akun dewan juri kehormatan dan delegasikan cabang lomba yang dinilai secara objektif."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Dewan Juri', to: '/admin/judges' },
        ]}
        actions={
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dewan Juri</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl">
        <div className="md:col-span-8">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari juri berdasarkan nama, email, institusi, atau kepakaran..."
          />
        </div>
        <div className="md:col-span-4">
          <FilterControl
            value={assignmentFilter}
            onChange={setAssignmentFilter}
            options={filterOptions}
          />
        </div>
      </div>

      {/* Judges Table */}
      <DataTable
        columns={columns}
        data={filteredJudges}
        keyExtractor={(item) => item.id}
        emptyMessage="Tidak ada profil dewan juri yang sesuai dengan kriteria pencarian."
      />

      {/* CREATE / EDIT JURI MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 my-8 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
                  {editingJudge ? 'Edit Profil Dewan Juri' : 'Tambah Dewan Juri Baru'}
                </h3>
                <p className="text-xs text-[#948277]">
                  Lengkapi data profil serta pilih cabang kompetisi yang akan dinilai.
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
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Dr. Ir. Hendra Prasetyo, M.T."
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Alamat Email Juri *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juri@itfest2026.id"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Institusi / Perusahaan
                  </label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="Contoh: Universitas Indonesia / Tokopedia"
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Bidang Keahlian *
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="Contoh: UI/UX & Human Interaction"
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                  {formErrors.specialization && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.specialization}</p>
                  )}
                </div>
              </div>

              {/* Assignment Checklist */}
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-2">
                  Tugaskan ke Cabang Kompetisi:
                </label>
                <div className="space-y-2 p-3 bg-[#1C1410] border border-[rgba(255,179,107,0.14)] rounded-2xl max-h-48 overflow-y-auto">
                  {competitions.map((comp) => {
                    const isChecked = formData.assignedCompetitions.includes(comp.id);
                    return (
                      <label
                        key={comp.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-colors ${
                          isChecked
                            ? 'bg-[#2A1D15] border-[#FF6A00]/50 text-[#FFF7F0]'
                            : 'hover:bg-[#211811] border-transparent text-[#C4B3A7]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCompetition(comp.id)}
                            className="rounded border-[#FFB36B]/30 bg-[#100B08] text-[#FF6A00] focus:ring-[#FF6A00]"
                          />
                          <span className="text-xs font-medium">{comp.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#FFB36B]">
                          {comp.category_label || comp.category}
                        </span>
                      </label>
                    );
                  })}
                </div>
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
                  {editingJudge ? 'Simpan Perubahan' : 'Daftarkan Juri'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Hapus Profil Juri?"
        message={`Apakah Anda yakin ingin menghapus data dewan juri "${confirmDelete.judgeName}"? Penugasan penilaian terkait akan dibatalkan.`}
        confirmLabel="Hapus Juri"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, judgeId: null, judgeName: '' })}
      />
    </div>
  );
};

export default AdminJudgesPage;
