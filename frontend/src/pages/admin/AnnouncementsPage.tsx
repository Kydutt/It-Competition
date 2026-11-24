import React, { useEffect, useState } from 'react'
import { Megaphone, Plus, Edit, Trash2, AlertCircle, RefreshCw, X, Search } from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminAnnouncement, AdminEvent } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedAudience, setSelectedAudience] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<AdminAnnouncement | null>(null)
  const [formData, setFormData] = useState({
    event_id: '',
    title: '',
    content: '',
    audience: 'public' as 'public' | 'all_participants' | 'specific_competition',
    status: 'published' as 'draft' | 'published' | 'archived',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchAnnouncements = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getAnnouncements({
        search: search.trim() || undefined,
        audience: selectedAudience || undefined,
      })
      setAnnouncements(res.data.data)
    } catch (err: any) {
      console.error('Failed to load announcements:', err)
      setError(err.response?.data?.message || 'Gagal memuat pengumuman.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    adminService.getEvents({ per_page: 50 }).then((res) => setEvents(res.data.data)).catch(console.error)
    fetchAnnouncements()
  }, [])

  const openCreateModal = () => {
    setEditingAnnouncement(null)
    setFormData({
      event_id: events[0]?.id ? String(events[0].id) : '',
      title: '',
      content: '',
      audience: 'public',
      status: 'published',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: AdminAnnouncement) => {
    setEditingAnnouncement(item)
    setFormData({
      event_id: item.event_id ? String(item.event_id) : (events[0]?.id ? String(events[0].id) : ''),
      title: item.title,
      content: item.content,
      audience: item.audience,
      status: item.status,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormError(null)
    try {
      const payload: any = {
        event_id: Number(formData.event_id),
        title: formData.title.trim(),
        content: formData.content.trim(),
        audience: formData.audience,
        status: formData.status,
      }

      if (editingAnnouncement) {
        await adminService.updateAnnouncement(editingAnnouncement.id, payload)
      } else {
        await adminService.createAnnouncement(payload)
      }
      setIsModalOpen(false)
      await fetchAnnouncements()
    } catch (err: any) {
      console.error('Failed to save announcement:', err)
      setFormError(err.response?.data?.message || 'Gagal menyimpan pengumuman.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus pengumuman ini?')) return
    try {
      await adminService.deleteAnnouncement(id)
      await fetchAnnouncements()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus pengumuman.')
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pengumuman Panitia</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Publikasikan informasi teknis, perubahan jadwal, dan pengumuman kepada publik & peserta.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          Tambah Pengumuman
        </Button>
      </div>

      <Card className="p-3.5 sm:p-4 border-slate-200 min-w-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAnnouncements()}
              placeholder="Cari judul pengumuman..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={selectedAudience}
              onChange={(e) => {
                setSelectedAudience(e.target.value)
                setTimeout(() => fetchAnnouncements(), 50)
              }}
              className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Target Audiens</option>
              <option value="public">Publik</option>
              <option value="all_participants">Seluruh Peserta</option>
              <option value="specific_competition">Kompetisi Tertentu</option>
            </select>

            <Button variant="outline" size="sm" onClick={fetchAnnouncements} className="w-full sm:w-auto gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat pengumuman...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Pengumuman</h3>
            <p className="text-xs text-slate-500">Klik 'Tambah Pengumuman' untuk membuat rilis baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Judul Pengumuman</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Target Audiens</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal Publikasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {announcements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>
                        <span>{item.title}</span>
                        <span className="text-[11px] text-slate-400 font-normal line-clamp-1 block">
                          {item.content}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.event?.name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-700">
                        {item.audience.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={item.status === 'published' ? 'success' : 'default'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="gap-1 py-1 px-2.5 text-xs"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="gap-1 py-1 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
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
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-2">
                {editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event *</label>
                <select
                  value={formData.event_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, event_id: e.target.value }))}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Contoh: Jadwal Technical Meeting & Pengumpulan Karya"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Konten *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  required
                  placeholder="Tuliskan isi pengumuman secara rinci..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audiens</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, audience: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="public">Publik (Website)</option>
                    <option value="all_participants">Seluruh Peserta Terdaftar</option>
                    <option value="specific_competition">Kompetisi Spesifik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-slate-100">
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Pengumuman'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
