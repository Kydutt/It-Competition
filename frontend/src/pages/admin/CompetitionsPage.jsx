import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Users,
  Coins,
  Sparkles,
  ExternalLink,
  Layers,
  Calendar
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import SearchInput from '../../components/dashboard/SearchInput';
import StatusBadge from '../../components/dashboard/StatusBadge';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import Button from '../../components/ui/Button';

// Category normalization helper
const normalizeCategory = (cat) => {
  if (!cat) return '';
  const s = String(cat).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('ui') && s.includes('ux')) return 'ui_ux';
  if (s.includes('web')) return 'web_dev';
  if (s.includes('mobile')) return 'mobile_dev';
  if (s.includes('comp') || s.includes('prog') || s.includes('algo') || s.includes('cpc')) return 'competitive_prog';
  if (s.includes('data') || s.includes('ai') || s.includes('analytic')) return 'data_science';
  if (s.includes('cyber') || s.includes('security') || s.includes('ctf') || s.includes('siber')) return 'cyber_security';
  return s;
};

// Status normalization helper
const normalizeStatus = (st) => {
  if (!st) return '';
  const s = String(st).toLowerCase().trim();
  if (s === 'draft') return 'draft';
  if (s === 'registration_open' || s === 'open' || s.includes('dibuka')) return 'registration_open';
  if (s === 'registration_closed' || s === 'closed' || s.includes('ditutup')) return 'registration_closed';
  if (s === 'judging' || s.includes('penjurian')) return 'judging';
  if (s === 'finished' || s === 'completed' || s.includes('selesai')) return 'finished';
  return s;
};

export const AdminCompetitionsPage = () => {
  // Sync state with mockService.competitions
  const [competitions, setCompetitions] = useState(() => {
    // Ensure mock service competitions are loaded and normalized
    if (!mockService.competitions || mockService.competitions.length === 0) {
      mockService.normalizeCompetitions();
    }
    return [...mockService.competitions];
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Feedback alerts
  const [alertMessage, setAlertMessage] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [selectedComp, setSelectedComp] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, compId: null, compName: '' });

  // Form state
  const defaultForm = {
    name: '',
    category: 'ui_ux',
    category_label: 'UI/UX Design',
    target_level: 'all',
    target_level_label: 'Umum / Mahasiswa & Pelajar',
    theme: '',
    description: '',
    prizePool: 'Rp 5.000.000',
    min_team_member: 1,
    max_team_member: 3,
    registration_fee: 50000,
    quota: 50,
    status: 'registration_open',
    guidebook_url: '/guidebook-itc-2026.pdf'
  };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  // Canonical Category definitions
  const categoryDefinitions = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'ui_ux', label: 'UI/UX Design' },
    { value: 'web_dev', label: 'Web Development' },
    { value: 'mobile_dev', label: 'Mobile App' },
    { value: 'competitive_prog', label: 'Competitive Programming' },
    { value: 'data_science', label: 'Data Science' },
    { value: 'cyber_security', label: 'Cyber Security' },
  ];

  // Canonical Status definitions
  const statusDefinitions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'registration_open', label: 'Pendaftaran Dibuka' },
    { value: 'registration_closed', label: 'Pendaftaran Ditutup' },
    { value: 'judging', label: 'Tahap Penjurian' },
    { value: 'finished', label: 'Selesai' },
  ];

  // Category counts based on available competitions
  const categoryCounts = useMemo(() => {
    const counts = { all: competitions.length };
    categoryDefinitions.forEach((cat) => {
      if (cat.value !== 'all') {
        counts[cat.value] = competitions.filter((comp) => {
          const c = normalizeCategory(comp.category) || normalizeCategory(comp.category_label);
          return c === cat.value;
        }).length;
      }
    });
    return counts;
  }, [competitions]);

  // Status counts based on available competitions
  const statusCounts = useMemo(() => {
    const counts = { all: competitions.length };
    statusDefinitions.forEach((st) => {
      if (st.value !== 'all') {
        counts[st.value] = competitions.filter((comp) => {
          const s = normalizeStatus(comp.status);
          return s === st.value;
        }).length;
      }
    });
    return counts;
  }, [competitions]);

  // Combined Filtering: search AND category AND status
  const filteredCompetitions = useMemo(() => {
    const query = search.toLowerCase().trim();

    return competitions.filter((comp) => {
      // 1. Search Query Condition
      const nameMatch = comp.name?.toLowerCase().includes(query) ?? false;
      const themeMatch = comp.theme?.toLowerCase().includes(query) ?? false;
      const categoryLabelMatch = comp.category_label?.toLowerCase().includes(query) ?? false;
      const descriptionMatch = comp.description?.toLowerCase().includes(query) ?? false;
      const matchSearch = query === '' || nameMatch || themeMatch || categoryLabelMatch || descriptionMatch;

      // 2. Category Condition
      const normalizedCat = normalizeCategory(comp.category) || normalizeCategory(comp.category_label);
      const matchCategory =
        categoryFilter === 'all' ||
        normalizedCat === categoryFilter ||
        comp.category === categoryFilter;

      // 3. Status Condition
      const normalizedSt = normalizeStatus(comp.status);
      const matchStatus =
        statusFilter === 'all' ||
        normalizedSt === statusFilter ||
        comp.status === statusFilter;

      // Combined AND Logic
      return matchSearch && matchCategory && matchStatus;
    });
  }, [competitions, search, categoryFilter, statusFilter]);

  // Check if any filter is currently active
  const isFilterActive = search.trim() !== '' || categoryFilter !== 'all' || statusFilter !== 'all';

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingComp(null);
    setFormData(defaultForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (comp) => {
    setEditingComp(comp);
    setFormData({
      id: comp.id,
      name: comp.name || '',
      category: normalizeCategory(comp.category) || 'ui_ux',
      category_label: comp.category_label || comp.category,
      target_level: comp.target_level || 'all',
      target_level_label: comp.target_level_label || 'Mahasiswa & Pelajar',
      theme: comp.theme || '',
      description: comp.description || '',
      prizePool: comp.prizePool || 'Rp 5.000.000',
      min_team_member: comp.min_team_member || 1,
      max_team_member: comp.max_team_member || 3,
      registration_fee: comp.registration_fee || 0,
      quota: comp.quota || 50,
      status: normalizeStatus(comp.status) || 'registration_open',
      guidebook_url: comp.guidebook_url || '/guidebook-itc-2026.pdf'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nama kompetisi wajib diisi';
    if (!formData.theme.trim()) errs.theme = 'Tema kompetisi wajib diisi';
    if (!formData.description.trim()) errs.description = 'Deskripsi kompetisi wajib diisi';
    if (Number(formData.min_team_member) < 1) errs.min_team_member = 'Minimal 1 anggota';
    if (Number(formData.max_team_member) < Number(formData.min_team_member)) {
      errs.max_team_member = 'Maksimal anggota tidak boleh kurang dari minimal';
    }
    if (Number(formData.quota) < 1) errs.quota = 'Kuota minimal 1 tim';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save (Create or Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const catObj = categoryDefinitions.find((c) => c.value === formData.category);
    const catLabel = catObj ? catObj.label : formData.category;

    const payload = {
      ...formData,
      category_label: catLabel,
      min_team_member: Number(formData.min_team_member),
      max_team_member: Number(formData.max_team_member),
      registration_fee: Number(formData.registration_fee),
      quota: Number(formData.quota),
    };

    const saved = mockService.createOrUpdateCompetition(payload);
    setCompetitions([...mockService.competitions]);
    setIsModalOpen(false);

    setAlertMessage({
      type: 'success',
      text: editingComp 
        ? `Cabang kompetisi "${saved.name}" berhasil diperbarui!` 
        : `Cabang kompetisi baru "${saved.name}" berhasil ditambahkan dan siap menerima pendaftaran!`
    });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Delete Action
  const handleDelete = () => {
    if (!confirmDelete.compId) return;
    const idx = mockService.competitions.findIndex((c) => c.id === confirmDelete.compId);
    if (idx !== -1) {
      const deletedName = mockService.competitions[idx].name;
      mockService.competitions.splice(idx, 1);
      mockService.saveState();
      setCompetitions([...mockService.competitions]);
      
      setAlertMessage({
        type: 'info',
        text: `Cabang kompetisi "${deletedName}" telah dihapus dari data lokal.`
      });
      setTimeout(() => setAlertMessage(null), 5000);
    }
    setConfirmDelete({ isOpen: false, compId: null, compName: '' });
  };

  // Table columns definition
  const columns = [
    {
      header: 'Cabang Lomba & Tema',
      accessor: 'name',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold font-display text-[#FFF7F0] text-sm hover:text-[#FF6A00] transition-colors">
              {row.name}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2A1D15] text-[#FFB36B] border border-[rgba(255,179,107,0.18)] font-semibold">
              {row.category_label || row.category}
            </span>
          </div>
          <p className="text-xs text-[#948277] line-clamp-1 max-w-md">{row.theme || row.description}</p>
        </div>
      ),
    },
    {
      header: 'Format Tim',
      accessor: 'team',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-xs font-mono text-[#C4B3A7]">
          <Users className="w-3.5 h-3.5 text-[#FFB36B]" />
          <span>
            {row.min_team_member === row.max_team_member
              ? `${row.min_team_member} Orang`
              : `${row.min_team_member} - ${row.max_team_member} Orang`}
          </span>
        </div>
      ),
    },
    {
      header: 'Biaya & Hadiah',
      accessor: 'fees',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-[#FF6A00] font-mono">
            {row.registration_fee > 0 ? `Rp ${row.registration_fee.toLocaleString('id-ID')}` : 'Gratis'}
          </p>
          <p className="text-[11px] text-[#FFB36B] font-mono">{row.prizePool}</p>
        </div>
      ),
    },
    {
      header: 'Kuota',
      accessor: 'quota',
      render: (row) => (
        <span className="text-xs font-mono text-[#C4B3A7] px-2 py-1 rounded-lg bg-[#211811] border border-[rgba(255,179,107,0.12)]">
          {row.quota} Tim
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} label={row.status_label} />,
    },
    {
      header: 'Aksi',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => {
              setSelectedComp(row);
              setIsDetailOpen(true);
            }}
            title="Lihat Detail Spesifikasi"
            className="p-1.5 rounded-lg text-[#C4B3A7] hover:text-[#FFF7F0] hover:bg-[#2A1D15] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Kompetisi"
            className="p-1.5 rounded-lg text-[#FFB36B] hover:text-[#FF6A00] hover:bg-[#2A1D15] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setConfirmDelete({
                isOpen: true,
                compId: row.id,
                compName: row.name,
              })
            }
            title="Hapus Kompetisi"
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
        title="Manajemen Cabang Kompetisi"
        description="Kelola seluruh cabang lomba IT, syarat eligibility, kuota peserta, rubrik penilaian, dan status pendaftaran."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Kompetisi', to: '/admin/competitions' },
        ]}
        actions={
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kompetisi</span>
          </Button>
        }
      />

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
            alertMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-[#948277] hover:text-[#FFF7F0] p-1 font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* FILTER PANEL SECTION */}
      <div className="bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl p-5 space-y-4">
        {/* Row 1: Search Bar & Status Dropdown + Reset Button */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-7">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari berdasarkan nama lomba, tema, atau deskripsi..."
            />
          </div>

          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-xs font-mono text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00] appearance-none cursor-pointer"
              >
                {statusDefinitions.map((st) => (
                  <option key={st.value} value={st.value} className="bg-[#1C1410] text-[#FFF7F0]">
                    {st.label} {st.value !== 'all' ? `(${statusCounts[st.value] || 0})` : `(${statusCounts.all})`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#FFB36B]">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            {isFilterActive ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2.5 px-3 rounded-xl bg-[#211811] hover:bg-[#FF6A00]/20 text-[#FFB36B] border border-[rgba(255,179,107,0.25)] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                title="Kembalikan semua filter ke kondisi awal"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Reset Filter</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-[#948277] w-full text-right pr-2">
                Total: <strong className="text-[#FFB36B]">{competitions.length}</strong> Cabang
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Pills with Counter Badges */}
        <div className="pt-2 border-t border-[rgba(255,179,107,0.1)]">
          <div className="flex items-center space-x-2 mb-2">
            <Layers className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="text-[11px] font-mono text-[#948277] uppercase tracking-wider">
              Filter Kategori:
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryDefinitions.map((cat) => {
              const isSelected = categoryFilter === cat.value;
              const count = categoryCounts[cat.value] || 0;

              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 border ${
                    isSelected
                      ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-orange-glow'
                      : 'bg-[#1C1410] text-[#C4B3A7] hover:text-[#FFF7F0] border-[rgba(255,179,107,0.14)] hover:border-[#FF6A00]/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-black/30 text-white font-bold'
                        : 'bg-[#2A1D15] text-[#FFB36B]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DATA DISPLAY SECTION */}
      {competitions.length === 0 ? (
        // Condition: Empty Source Data
        <div className="p-12 bg-[#17110D] border border-[rgba(255,179,107,0.18)] rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2A1D15] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FFB36B] mx-auto shadow-orange-glow">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
              Belum Ada Cabang Kompetisi
            </h3>
            <p className="text-xs text-[#948277] max-w-md mx-auto">
              Database kompetisi belum memiliki data. Buat cabang lomba perdana Anda untuk memulai festival.
            </p>
          </div>
          <Button onClick={handleOpenAdd} variant="primary" className="text-xs">
            + Tambah Kompetisi Pertama
          </Button>
        </div>
      ) : filteredCompetitions.length === 0 ? (
        // Condition: Filter Result Empty
        <div className="p-12 bg-[#17110D] border border-[rgba(255,179,107,0.18)] rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2A1D15] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FF6A00] mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display text-[#FFF7F0]">
              Tidak ada kompetisi yang sesuai dengan filter
            </h3>
            <p className="text-xs text-[#948277] max-w-md mx-auto">
              Tidak ditemukan cabang lomba yang memenuhi kriteria pencarian dan filter yang aktif saat ini.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={handleResetFilters} variant="primary" className="text-xs inline-flex items-center space-x-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </Button>
          </div>
        </div>
      ) : (
        // Condition: Data Available
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-[#948277]">
            <span>
              Menampilkan <strong className="text-[#FFF7F0]">{filteredCompetitions.length}</strong> dari{' '}
              <strong className="text-[#FFB36B]">{competitions.length}</strong> kompetisi
            </span>
            {isFilterActive && (
              <span className="text-[#FF6A00]">Filter aktif diterapkan</span>
            )}
          </div>

          <DataTable
            columns={columns}
            data={filteredCompetitions}
            keyField="id"
            pageSize={10}
            emptyTitle="Tidak ada kompetisi"
            emptyDescription="Tidak ada data yang dapat ditampilkan."
          />
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 my-8 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
                  {editingComp ? 'Edit Cabang Kompetisi' : 'Tambah Cabang Kompetisi Baru'}
                </h3>
                <p className="text-xs text-[#948277]">
                  Konfigurasikan spesifikasi lomba, eligibility, kuota peserta, dan status pendaftaran.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Nama Kompetisi *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: UI/UX Design Competition"
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Kategori Lomba *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="ui_ux">UI/UX Design</option>
                    <option value="web_dev">Web Development</option>
                    <option value="mobile_dev">Mobile App</option>
                    <option value="competitive_prog">Competitive Programming</option>
                    <option value="data_science">Data Science</option>
                    <option value="cyber_security">Cyber Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Tingkat Sasaran (Eligibility)
                  </label>
                  <select
                    value={formData.target_level}
                    onChange={(e) => setFormData({ ...formData, target_level: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="all">Semua (Mahasiswa & SMA/SMK)</option>
                    <option value="mahasiswa">Mahasiswa (D3/D4/S1)</option>
                    <option value="siswa">Pelajar SMA/SMK Sederajat</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Tema Lomba *
                  </label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    placeholder="Contoh: Digital Inclusion for Sustainable Future"
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                  {formErrors.theme && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.theme}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Deskripsi Ringkas *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan gambaran umum dan output yang diharapkan dari kompetisi..."
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                  {formErrors.description && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Min Anggota Tim
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.min_team_member}
                    onChange={(e) => setFormData({ ...formData, min_team_member: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Maks Anggota Tim
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.max_team_member}
                    onChange={(e) => setFormData({ ...formData, max_team_member: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                  {formErrors.max_team_member && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.max_team_member}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Biaya Registrasi (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={formData.registration_fee}
                    onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Kuota Tim
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Status Kompetisi *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="draft">Draft</option>
                    <option value="registration_open">Pendaftaran Dibuka</option>
                    <option value="registration_closed">Pendaftaran Ditutup</option>
                    <option value="judging">Tahap Penjurian</option>
                    <option value="finished">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Guidebook URL / Berkas
                  </label>
                  <input
                    type="text"
                    value={formData.guidebook_url}
                    onChange={(e) => setFormData({ ...formData, guidebook_url: e.target.value })}
                    placeholder="/guidebook-lomba.pdf"
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
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
                  {editingComp ? 'Simpan Perubahan' : 'Buat Kompetisi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {isDetailOpen && selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#FFB36B] uppercase">DETAIL SPESIFIKASI</span>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">{selectedComp.name}</h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-[#948277] hover:text-[#FFF7F0] p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-2">
                <p className="text-xs font-mono text-[#FFB36B] uppercase">Tema Resmi</p>
                <p className="font-semibold text-[#FFF7F0]">{selectedComp.theme}</p>
                <p className="text-xs text-[#C4B3A7] leading-relaxed">{selectedComp.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                  <span className="text-[#948277] block text-[10px]">KATEGORI</span>
                  <span className="text-[#FFF7F0] font-bold">{selectedComp.category_label || selectedComp.category}</span>
                </div>
                <div className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                  <span className="text-[#948277] block text-[10px]">TOTAL PRIZE POOL</span>
                  <span className="text-[#FF6A00] font-bold">{selectedComp.prizePool}</span>
                </div>
                <div className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                  <span className="text-[#948277] block text-[10px]">BIAYA PENDAFTARAN</span>
                  <span className="text-[#FFF7F0] font-bold">
                    {selectedComp.registration_fee > 0 ? `Rp ${selectedComp.registration_fee.toLocaleString('id-ID')}` : 'Gratis'}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                  <span className="text-[#948277] block text-[10px]">KUOTA TIM</span>
                  <span className="text-[#FFF7F0] font-bold">{selectedComp.quota} Tim</span>
                </div>
              </div>

              <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-2">
                <p className="text-xs font-mono text-[#FFB36B] uppercase">Rubrik Penilaian Terkonfigurasi</p>
                <div className="space-y-1.5">
                  {(selectedComp.rubric || [
                    { id: 'crit-1', name: 'Kualitas Teknis', weight: 40 },
                    { id: 'crit-2', name: 'Inovasi', weight: 30 },
                    { id: 'crit-3', name: 'Presentasi', weight: 20 },
                    { id: 'crit-4', name: 'Dokumentasi', weight: 10 },
                  ]).map((rub) => (
                    <div key={rub.id} className="flex justify-between items-center text-xs">
                      <span className="text-[#C4B3A7]">{rub.name}</span>
                      <span className="font-mono text-[#FFB36B] font-bold">{rub.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Hapus Cabang Kompetisi?"
        message={`Apakah Anda yakin ingin menghapus "${confirmDelete.compName}"? Tindakan ini akan menghapus data pendaftaran terkait dalam prototipe ini.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, compId: null, compName: '' })}
      />
    </div>
  );
};

export default AdminCompetitionsPage;
