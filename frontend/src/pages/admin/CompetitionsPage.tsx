import React, { useEffect, useState } from 'react'
import {
  Swords,
  Plus,
  Search,
  Edit,
  AlertCircle,
  RefreshCw,
  Users,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminCompetition, AdminEvent, AdminCategory } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const CompetitionsPage: React.FC = () => {
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([])
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<AdminCompetition | null>(null)
  const [formData, setFormData] = useState({
    event_id: '',
    category_id: '',
    name: '',
    short_description: '',
    description: '',
    registration_type: 'individual' as 'individual' | 'team',
    min_members: 1,
    max_members: 1,
    registration_start: '',
    registration_deadline: '',
    submission_deadline: '',
    status: 'published' as 'draft' | 'published' | 'closed' | 'archived',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete Confirmation State
  const [deletingCompetition, setDeletingCompetition] = useState<AdminCompetition | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchCompetitions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getCompetitions({
        search: search.trim() || undefined,
        event_id: selectedEvent ? Number(selectedEvent) : undefined,
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
      })
      setCompetitions(res.data.data)
    } catch (err: any) {
      console.error('Failed to load competitions:', err)
      setError(err.response?.data?.message || 'Gagal memuat cabang kompetisi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load metadata (events, categories)
    Promise.all([
      adminService.getEvents({ per_page: 50 }),
      adminService.getCategories(),
    ])
      .then(([eventsRes, catRes]) => {
        setEvents(eventsRes.data.data)
        setCategories(catRes.data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchCompetitions()
  }, [selectedEvent, selectedCategory])

  const openCreateModal = () => {
    setEditingCompetition(null)
    setFormData({
      event_id: events[0]?.id ? String(events[0].id) : '',
      category_id: categories[0]?.id ? String(categories[0].id) : '',
      name: '',
      short_description: '',
      description: '',
      registration_type: 'individual',
      min_members: 1,
      max_members: 1,
      registration_start: new Date().toISOString().slice(0, 10),
      registration_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      submission_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'published',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (comp: AdminCompetition) => {
    setEditingCompetition(comp)
    setFormData({
      event_id: String(comp.event_id),
      category_id: String(comp.category_id),
      name: comp.name,
      short_description: comp.short_description || '',
      description: comp.description || '',
      registration_type: comp.registration_type || 'individual',
      min_members: comp.min_members || 1,
      max_members: comp.max_members || 1,
      registration_start: comp.registration_start ? comp.registration_start.slice(0, 10) : '',
      registration_deadline: comp.registration_deadline ? comp.registration_deadline.slice(0, 10) : '',
      submission_deadline: comp.submission_deadline ? comp.submission_deadline.slice(0, 10) : '',
      status: (comp.status as any) || 'published',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormError(null)

    try {
      const payload: Partial<AdminCompetition> = {
        event_id: Number(formData.event_id),
        category_id: Number(formData.category_id),
        name: formData.name,
        short_description: formData.short_description || undefined,
        description: formData.description,
        registration_type: formData.registration_type,
        min_members: Number(formData.min_members),
        max_members: Number(formData.max_members),
        registration_start: formData.registration_start,
        registration_deadline: formData.registration_deadline,
        submission_deadline: formData.submission_deadline || undefined,
        status: formData.status as any,
      }

      if (editingCompetition) {
        await adminService.updateCompetition(editingCompetition.id, payload)
      } else {
        await adminService.createCompetition(payload)
      }

      setIsModalOpen(false)
      await fetchCompetitions()
    } catch (err: any) {
      console.error('Failed to save competition:', err)
      setFormError(err.response?.data?.message || 'Gagal menyimpan kompetisi. Periksa kembali form.')
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteModal = (comp: AdminCompetition) => {
    setDeletingCompetition(comp)
    setDeleteError(null)
  }

  const handleDeleteCompetition = async () => {
    if (!deletingCompetition) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await adminService.deleteCompetition(deletingCompetition.id)
      setFeedbackMessage({
        type: 'success',
        text: res.message || `Cabang kompetisi "${deletingCompetition.name}" berhasil dihapus.`,
      })
      setDeletingCompetition(null)
      await fetchCompetitions()
    } catch (err: any) {
      console.error('Failed to delete competition:', err)
      const errorMsg =
        err.response?.data?.message ||
        'Gagal menghapus cabang kompetisi. Terjadi kesalahan pada server.'
      setDeleteError(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Cabang Kompetisi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola cabang lomba IT, ketentuan partisipasi (individu/tim), dan batas waktu pendaftaran.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          Tambah Kompetisi
        </Button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl flex items-start justify-between gap-3 text-xs sm:text-sm border shadow-2xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Card */}
      <Card className="p-3 sm:p-4 border-slate-200">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCompetitions()}
              placeholder="Cari cabang kompetisi..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Event</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={fetchCompetitions} className="w-full sm:w-auto gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Terapkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Competitions Table */}
      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat cabang kompetisi...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Swords className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Kompetisi</h3>
            <p className="text-xs text-slate-500">Klik 'Tambah Kompetisi' untuk membuat cabang lomba baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Kompetisi</th>
                  <th className="py-3 px-4">Event & Kategori</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Pendaftar</th>
                  <th className="py-3 px-4">Batas Pendaftaran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {competitions.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>
                        <span>{comp.name}</span>
                        {comp.short_description && (
                          <span className="text-[11px] text-slate-400 font-normal line-clamp-1 block">
                            {comp.short_description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 block">{comp.event?.name || '-'}</span>
                      <span className="text-[11px] text-slate-400">{comp.category?.name || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-700">
                        {comp.registration_type === 'team'
                          ? `Tim (${comp.min_members}-${comp.max_members} org)`
                          : 'Individu'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {comp.registrations_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {comp.registration_deadline
                        ? new Date(comp.registration_deadline).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={comp.status === 'published' ? 'success' : 'default'}>
                        {comp.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(comp)}
                          className="gap-1 py-1 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200"
                          title="Edit Cabang Kompetisi"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(comp)}
                          className="gap-1 py-1 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          title="Hapus Cabang Kompetisi"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-2">
                {editingCompetition ? 'Edit Cabang Kompetisi' : 'Tambah Cabang Kompetisi Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Perhelatan *</label>
                  <select
                    value={formData.event_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, event_id: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Pilih Event...</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Kompetisi *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Cabang Kompetisi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Contoh: Web Development Competition"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Ringkasan 1-2 kalimat untuk kartu kompetisi..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Ketentuan Lengkap *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Jelaskan tema, mekanisme lomba, kriteria penilaian, dsb..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Peserta *</label>
                  <select
                    value={formData.registration_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, registration_type: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="individual">Individu</option>
                    <option value="team">Tim (Berkelompok)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Anggota</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.min_members}
                    onChange={(e) => setFormData((prev) => ({ ...prev, min_members: Number(e.target.value) }))}
                    disabled={formData.registration_type === 'individual'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maks. Anggota</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.max_members}
                    onChange={(e) => setFormData((prev) => ({ ...prev, max_members: Number(e.target.value) }))}
                    disabled={formData.registration_type === 'individual'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mulai Registrasi *</label>
                  <input
                    type="date"
                    value={formData.registration_start}
                    onChange={(e) => setFormData((prev) => ({ ...prev, registration_start: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Registrasi *</label>
                  <input
                    type="date"
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, registration_deadline: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Pengumpulan Karya</label>
                  <input
                    type="date"
                    value={formData.submission_deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, submission_deadline: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Publikasi</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="published">Published (Aktif & Tampil)</option>
                  <option value="draft">Draft (Disembunyikan)</option>
                  <option value="closed">Closed (Pendaftaran Ditutup)</option>
                  <option value="archived">Archived (Diarsipkan)</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? 'Menyimpan...' : 'Simpan Kompetisi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCompetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Hapus Cabang Kompetisi?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setDeletingCompetition(null)
                }}
                disabled={isDeleting}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <p className="leading-relaxed">
                Apakah Anda yakin ingin menghapus cabang kompetisi ini? Tindakan ini tidak dapat dibatalkan.
              </p>

              {/* Selected Competition Information Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900 text-sm">
                  {deletingCompetition.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Event: <strong className="text-slate-700">{deletingCompetition.event?.name || '-'}</strong></span>
                  <span>•</span>
                  <span>Kategori: <strong className="text-slate-700">{deletingCompetition.category?.name || '-'}</strong></span>
                </div>
                {deletingCompetition.registrations_count !== undefined && deletingCompetition.registrations_count > 0 && (
                  <div className="pt-2 flex items-start gap-2 text-amber-700 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Cabang ini memiliki <strong>{deletingCompetition.registrations_count} pendaftaran</strong> peserta terdaftar. Penghapusan akan ditolak sistem untuk melindungi data pendaftar.
                    </span>
                  </div>
                )}
              </div>

              {/* Rejection / Error Alert */}
              {deleteError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <span className="font-bold text-red-800 block">Penghapusan Ditolak Sistem</span>
                    <span>{deleteError}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCompetition(null)}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDeleteCompetition}
                disabled={isDeleting}
                isLoading={isDeleting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600 font-bold"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus Cabang Kompetisi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
