import React, { useEffect, useState } from 'react'
import { Calendar, Plus, Edit, Trash2, AlertCircle, RefreshCw, X, MapPin, Link2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminSchedule, AdminEvent } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<AdminSchedule[]>([])
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AdminSchedule | null>(null)
  const [formData, setFormData] = useState({
    event_id: '',
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    meeting_url: '',
    is_published: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      const res = await adminService.getEvents({ per_page: 50 })
      setEvents(res.data.data)
      if (res.data.data.length > 0 && !selectedEventId) {
        setSelectedEventId(String(res.data.data[0].id))
      }
    } catch (err: any) {
      console.error('Failed to load events for schedule filter:', err)
    }
  }

  const fetchSchedules = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getSchedules({
        event_id: selectedEventId ? Number(selectedEventId) : undefined,
      })
      setSchedules(res.data)
    } catch (err: any) {
      console.error('Failed to load schedules:', err)
      setError(err.response?.data?.message || 'Gagal memuat jadwal kegiatan.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [selectedEventId])

  const openCreateModal = () => {
    setEditingSchedule(null)
    setFormData({
      event_id: selectedEventId || (events[0]?.id ? String(events[0].id) : ''),
      title: '',
      description: '',
      start_at: new Date().toISOString().slice(0, 16),
      end_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16),
      location: 'Auditorium Utama',
      meeting_url: '',
      is_published: true,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: AdminSchedule) => {
    setEditingSchedule(item)
    setFormData({
      event_id: String(item.event_id),
      title: item.title,
      description: item.description || '',
      start_at: item.start_at ? item.start_at.slice(0, 16) : '',
      end_at: item.end_at ? item.end_at.slice(0, 16) : '',
      location: item.location || '',
      meeting_url: item.meeting_url || '',
      is_published: item.is_published,
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
        description: formData.description.trim() || undefined,
        start_at: formData.start_at,
        end_at: formData.end_at || undefined,
        location: formData.location.trim() || undefined,
        meeting_url: formData.meeting_url.trim() || undefined,
        is_published: Boolean(formData.is_published),
      }

      if (editingSchedule) {
        await adminService.updateSchedule(editingSchedule.id, payload)
      } else {
        await adminService.createSchedule(payload)
      }
      setIsModalOpen(false)
      await fetchSchedules()
    } catch (err: any) {
      console.error('Failed to save schedule:', err)
      setFormError(err.response?.data?.message || 'Gagal menyimpan agenda jadwal.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus agenda jadwal ini?')) return
    try {
      await adminService.deleteSchedule(id)
      await fetchSchedules()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus jadwal.')
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Manajemen Jadwal Kegiatan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur timeline, technical meeting, babak penyisihan, presentasi final, dan agenda kompetisi.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          Tambah Agenda Jadwal
        </Button>
      </div>

      <Card className="p-3.5 sm:p-4 border-slate-200 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-600">Filter Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Event</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={fetchSchedules} className="w-full sm:w-auto gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Segarkan
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat jadwal kegiatan...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Agenda Jadwal</h3>
            <p className="text-xs text-slate-500">Klik 'Tambah Agenda Jadwal' untuk membuat timeline kegiatan baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Agenda / Kegiatan</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Waktu Mulai - Selesai</th>
                  <th className="py-3 px-4">Lokasi & Tautan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>
                        <span>{item.title}</span>
                        {item.description && (
                          <span className="text-[11px] text-slate-400 font-normal line-clamp-1 block">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.event?.name || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div>{new Date(item.start_at).toLocaleString('id-ID')}</div>
                      {item.end_at && (
                        <div className="text-[11px] text-slate-400">s/d {new Date(item.end_at).toLocaleString('id-ID')}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {item.location && (
                          <div className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location}</span>
                          </div>
                        )}
                        {item.meeting_url && (
                          <a
                            href={item.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--color-brand-blue)] hover:underline"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Buka Pertemuan Daring</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={item.is_published ? 'success' : 'default'}>
                        {item.is_published ? 'Published' : 'Hidden'}
                      </Badge>
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

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-2">
                {editingSchedule ? 'Edit Agenda Jadwal' : 'Tambah Agenda Jadwal Baru'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Agenda Kegiatan *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Contoh: Technical Meeting & Briefing Lomba"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Kegiatan</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Instruksi dan rincian agenda..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Mulai *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_at: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_at: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Fisik / Tempat</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Contoh: Auditorium Utama Gedung A"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tautan Rapat Daring (URL)</label>
                  <input
                    type="url"
                    value={formData.meeting_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, meeting_url: e.target.value }))}
                    placeholder="https://zoom.us/j/..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Publikasi</label>
                <select
                  value={formData.is_published ? 'true' : 'false'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.value === 'true' }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="true">Published (Ditampilkan ke Peserta & Publik)</option>
                  <option value="false">Hidden (Draf Panitia)</option>
                </select>
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Agenda Jadwal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
