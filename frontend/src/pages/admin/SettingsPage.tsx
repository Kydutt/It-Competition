import React, { useEffect, useState } from 'react'
import { Sliders, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    site_name: 'IT Competition Platform',
    contact_email: 'panitia@itcomp.test',
    contact_phone: '+62 812-3456-7890',
    organizer_name: 'Himpunan Mahasiswa Teknologi Informasi',
    registration_guide_url: 'https://itcomp.test/guidebook.pdf',
    payment_enabled: 'false',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    setIsLoading(true)
    setError(null)
    setMessage(null)
    try {
      const res = await adminService.getSettings()
      if (res.data && Object.keys(res.data).length > 0) {
        setSettings((prev) => ({ ...prev, ...res.data }))
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err)
      setError(err.response?.data?.message || 'Gagal memuat pengaturan sistem.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)
    try {
      await adminService.updateSettings(settings)
      setMessage('Pengaturan operasional berhasil disimpan dan diperbarui ke sistem.')
    } catch (err: any) {
      console.error('Failed to update settings:', err)
      setError(err.response?.data?.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 max-w-4xl min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pengaturan Operasional Platform</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Konfigurasi kontak panitia, identitas perhelatan, dan aturan operasional tingkat sistem.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan
        </Button>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs sm:text-sm rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 text-red-800 text-xs sm:text-sm rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Memuat konfigurasi sistem...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Platform */}
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-[var(--color-brand-blue)]" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Identitas & Penyelenggara</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Platform / Acara</label>
              <input
                type="text"
                value={settings.site_name || ''}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Organisasi / Panitia</label>
              <input
                type="text"
                value={settings.organizer_name || ''}
                onChange={(e) => setSettings({ ...settings, organizer_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>
        </Card>

        {/* Informasi Kontak Resmi */}
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Kontak Resmi Panitia</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Layanan Panitia</label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / Hotline</label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>
        </Card>

        {/* Tautan Dokumen Panduan & Aturan */}
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Panduan & Modul Pembayaran</h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tautan Guidebook Umum (URL)
              </label>
              <input
                type="url"
                value={settings.registration_guide_url || ''}
                onChange={(e) => setSettings({ ...settings, registration_guide_url: e.target.value })}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 focus:border-[var(--color-brand-blue)]"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 text-xs block">
                    Status Modul Pembayaran (Payment Gateway)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sesuai PRD dan AGENTS.md, pembayaran opsional dinonaktifkan secara bawaan.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                  {settings.payment_enabled === 'true' ? 'Aktif' : 'Dinonaktifkan'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving}
            className="w-full sm:w-auto gap-1.5 px-5 font-semibold"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </form>
      )}
    </div>
  )
}
