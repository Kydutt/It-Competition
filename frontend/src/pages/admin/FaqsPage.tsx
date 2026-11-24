import React, { useEffect, useState } from 'react'
import { HelpCircle, Plus, Edit, Trash2, AlertCircle, RefreshCw, X, Search } from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminFaq } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export const FaqsPage: React.FC = () => {
  const [faqs, setFaqs] = useState<AdminFaq[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<AdminFaq | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Umum',
    sort_order: 1,
    is_published: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchFaqs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getFaqs({
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
      })
      setFaqs(res.data)
    } catch (err: any) {
      console.error('Failed to load FAQs:', err)
      setError(err.response?.data?.message || 'Gagal memuat FAQ.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [selectedCategory])

  const openCreateModal = () => {
    setEditingFaq(null)
    setFormData({
      question: '',
      answer: '',
      category: 'Umum',
      sort_order: (faqs.length || 0) + 1,
      is_published: true,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (faq: AdminFaq) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'Umum',
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormError(null)
    try {
      if (editingFaq) {
        await adminService.updateFaq(editingFaq.id, formData)
      } else {
        await adminService.createFaq(formData)
      }
      setIsModalOpen(false)
      await fetchFaqs()
    } catch (err: any) {
      console.error('Failed to save FAQ:', err)
      setFormError(err.response?.data?.message || 'Gagal menyimpan FAQ.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus FAQ ini?')) return
    try {
      await adminService.deleteFaq(id)
      await fetchFaqs()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus FAQ.')
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Tanya Jawab (FAQ)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola daftar pertanyaan umum dan jawaban untuk membantu peserta lomba.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          Tambah FAQ
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
              onKeyDown={(e) => e.key === 'Enter' && fetchFaqs()}
              placeholder="Cari pertanyaan atau jawaban FAQ..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Kategori</option>
              <option value="Umum">Umum</option>
              <option value="Pendaftaran">Pendaftaran</option>
              <option value="Kompetisi">Kompetisi</option>
              <option value="Submisi">Submisi & Karya</option>
            </select>

            <Button variant="outline" size="sm" onClick={fetchFaqs} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat FAQ...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada FAQ</h3>
            <p className="text-xs text-slate-500">Klik 'Tambah FAQ' untuk menambahkan tanya jawab baru.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Urutan: {faq.sort_order}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {faq.category || 'Umum'}
                    </span>
                    <Badge variant={faq.is_published ? 'success' : 'default'}>
                      {faq.is_published ? 'Tampil' : 'Disembunyikan'}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{faq.question}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(faq)}
                    className="gap-1 py-1 px-2.5 text-xs"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(faq.id)}
                    className="gap-1 py-1 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-2">
                {editingFaq ? 'Edit Pertanyaan FAQ' : 'Tambah FAQ Baru'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Contoh: Pendaftaran"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pertanyaan *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                  required
                  placeholder="Contoh: Apakah peserta dapat mengikuti lebih dari 1 lomba?"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jawaban *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
                  rows={4}
                  required
                  placeholder="Jawaban rinci..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Urutan</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sort_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Tampil</label>
                  <select
                    value={formData.is_published ? 'true' : 'false'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.value === 'true' }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="true">Dipublikasikan</option>
                    <option value="false">Disembunyikan</option>
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
                  {isSaving ? 'Menyimpan...' : 'Simpan FAQ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
