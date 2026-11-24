import React, { useEffect, useState } from 'react'
import {
  Tags,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { AdminCategory } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{
    message: string
    competitions?: string[]
  } | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getCategories()
      setCategories(res.data)
    } catch (err: any) {
      console.error('Failed to load categories:', err)
      setError(err.response?.data?.message || 'Gagal memuat kategori lomba.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat)
    setFormData({ name: cat.name, description: cat.description || '' })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormError(null)
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData)
      } else {
        await adminService.createCategory(formData)
      }
      setIsModalOpen(false)
      setFeedbackMessage({
        type: 'success',
        text: editingCategory
          ? `Kategori "${formData.name}" berhasil diperbarui.`
          : `Kategori "${formData.name}" berhasil ditambahkan.`,
      })
      await fetchCategories()
    } catch (err: any) {
      console.error('Failed to save category:', err)
      setFormError(err.response?.data?.message || 'Gagal menyimpan kategori.')
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteModal = (cat: AdminCategory) => {
    setDeletingCategory(cat)
    setDeleteError(null)
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await adminService.deleteCategory(deletingCategory.id)
      setFeedbackMessage({
        type: 'success',
        text: res.message || `Kategori "${deletingCategory.name}" berhasil dihapus.`,
      })
      setDeletingCategory(null)
      await fetchCategories()
    } catch (err: any) {
      console.error('Failed to delete category:', err)
      const errorData = err.response?.data
      setDeleteError({
        message:
          errorData?.message ||
          'Gagal menghapus kategori. Terjadi kesalahan pada server.',
        competitions: errorData?.data?.competitions,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Kategori Lomba</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola pengelompokan cabang kompetisi IT (Software, Cyber Security, Data Science, dll).
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          Tambah Kategori
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

      {/* Categories Table Card */}
      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat kategori...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tags className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Kategori</h3>
            <p className="text-xs text-slate-500">Klik 'Tambah Kategori' untuk membuat kategori baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Jumlah Cabang Lomba</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{cat.name}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-md">{cat.description || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <Tags className="w-3.5 h-3.5 text-slate-400" />
                        {cat.competitions_count || 0} cabang
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(cat)}
                          className="gap-1 py-1 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200"
                          title="Edit Kategori Lomba"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(cat)}
                          className="gap-1 py-1 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          title="Hapus Kategori Lomba"
                          aria-label={`Hapus ${cat.name}`}
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
                {editingCategory ? 'Edit Kategori Lomba' : 'Tambah Kategori Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Contoh: Cybersecurity"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Penjelasan cakupan bidang lomba kategori ini..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Kategori'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Hapus Kategori Lomba?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setDeletingCategory(null)
                }}
                disabled={isDeleting}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <p className="leading-relaxed">
                Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
              </p>

              {/* Selected Category Information Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900 text-sm">
                  {deletingCategory.name}
                </p>
                {deletingCategory.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {deletingCategory.description}
                  </p>
                )}
                {deletingCategory.competitions_count !== undefined && deletingCategory.competitions_count > 0 && (
                  <div className="pt-1.5 flex items-start gap-2 text-amber-700 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Kategori ini saat ini digunakan oleh <strong>{deletingCategory.competitions_count} cabang lomba</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Delete Error / 409 Conflict Details */}
              {deleteError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 leading-relaxed">
                      <span className="font-bold text-red-800 block">Kategori Tidak Dapat Dihapus</span>
                      <span>{deleteError.message}</span>
                    </div>
                  </div>

                  {deleteError.competitions && deleteError.competitions.length > 0 && (
                    <div className="pl-6 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Cabang kompetisi terkait:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {deleteError.competitions.map((compName, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-white rounded-md border border-red-200 text-slate-800 font-medium"
                          >
                            {compName}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Instruksi: Buka menu Cabang Kompetisi, lalu ubah kategori pada cabang kompetisi di atas sebelum menghapus kategori ini.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
              {deleteError ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingCategory(null)}
                  className="w-full sm:w-auto"
                >
                  Tutup
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingCategory(null)}
                    disabled={isDeleting}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleDeleteCategory}
                    disabled={isDeleting}
                    isLoading={isDeleting}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600 font-bold"
                  >
                    {isDeleting ? 'Menghapus...' : 'Hapus Kategori'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
