import React, { useEffect, useState } from 'react'
import { CalendarDays, Plus, Edit, Trash2, AlertCircle, RefreshCw, X } from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminEvent } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    theme: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    status: 'published' as 'draft' | 'published' | 'archived',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchEvents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getEvents({ per_page: 50 })
      setEvents(res.data.data)
    } catch (err: any) {
      console.error('Failed to load events:', err)
      setError(err.response?.data?.message || 'Gagal memuat event perhelatan.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const openCreateModal = () => {
    setEditingEvent(null)
    setFormData({
      name: '',
      theme: '',
      description: '',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      location: 'Auditorium Utama & Online',
      status: 'published',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (evt: AdminEvent) => {
    setEditingEvent(evt)
    setFormData({
      name: evt.name,
      theme: evt.theme || '',
      description: evt.description || '',
      start_date: evt.start_date.slice(0, 10),
      end_date: evt.end_date.slice(0, 10),
      location: evt.location || '',
      status: evt.status,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormError(null)
    try {
      if (editingEvent) {
        await adminService.updateEvent(editingEvent.id, formData)
      } else {
        await adminService.createEvent(formData)
      }
      setIsModalOpen(false)
      await fetchEvents()
    } catch (err: any) {
      console.error('Failed to save event:', err)
      setFormError(err.response?.data?.message || 'Gagal menyimpan event.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus event ini?')) return
    try {
      await adminService.deleteEvent(id)
      await fetchEvents()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus event.')
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Event & Perhelatan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola edisi perhelatan kompetisi tahunan dan tanggal pelaksanaan.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          Tambah Event
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat event...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Event</h3>
            <p className="text-xs text-slate-500">Klik 'Tambah Event' untuk membuat event baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Event</th>
                  <th className="py-3 px-4">Tema & Lokasi</th>
                  <th className="py-3 px-4">Periode Tanggal</th>
                  <th className="py-3 px-4">Cabang Lomba</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{evt.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 block">{evt.theme || '-'}</span>
                      <span className="text-[11px] text-slate-400">{evt.location || '-'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(evt.start_date).toLocaleDateString('id-ID')} -{' '}
                      {new Date(evt.end_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {evt.competitions_count || 0} cabang
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={evt.status === 'published' ? 'success' : 'default'}>
                        {evt.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(evt)}
                          className="gap-1 py-1 px-2.5 text-xs"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(evt.id)}
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
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-2">
                {editingEvent ? 'Edit Event' : 'Tambah Event Baru'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Event *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Contoh: IT Fest 2026"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tema Perhelatan</label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData((prev) => ({ ...prev, theme: e.target.value }))}
                  placeholder="Contoh: Accelerating AI for Society"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mulai *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selesai *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
