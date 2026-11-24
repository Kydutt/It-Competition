import React, { useEffect, useState } from 'react'
import { History, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { ActivityLog } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Expanded log row for JSON diff inspection
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)

  const fetchLogs = async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminService.getActivityLogs({
        page,
        per_page: 20,
        action: actionFilter.trim() || undefined,
        entity_type: entityFilter.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })

      setLogs(res.data.data)
      setCurrentPage(res.data.current_page)
      setTotalPages(res.data.last_page)
      setTotalCount(res.data.total)
    } catch (err: any) {
      console.error('Failed to load activity logs:', err)
      setError(err.response?.data?.message || 'Gagal memuat log audit aktivitas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [entityFilter])

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Audit Trail Log Aktivitas</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log tindakan administratif dan perubahan status sistem (Append-only / Tidak dapat diubah).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs(currentPage)} className="w-full sm:w-auto gap-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5 sm:p-4 border-slate-200 min-w-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            fetchLogs(1)
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs"
        >
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Action</label>
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Contoh: registration.status_update"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Entitas</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Entitas</option>
              <option value="Registration">Registration</option>
              <option value="RegistrationDocument">RegistrationDocument</option>
              <option value="Submission">Submission</option>
              <option value="Competition">Competition</option>
              <option value="Event">Event</option>
              <option value="Announcement">Announcement</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="h-[38px] px-4 text-xs font-semibold">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden border-slate-200 min-w-0">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat log aktivitas...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Tidak Ada Log Tercatat</h3>
            <p className="text-xs text-slate-500">Tidak ada riwayat tindakan yang cocok dengan filter ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pelaksana</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entitas</th>
                  <th className="py-3 px-4">Alamat IP</th>
                  <th className="py-3 px-4 text-right">Rincian Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{log.user?.name || 'Sistem'}</span>
                          <span className="text-[11px] text-slate-400">{log.user?.email || '-'}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{log.entity_type}</span>
                          <span className="text-slate-400 ml-1">#{log.entity_id}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {log.ip_address || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {(log.old_values || log.new_values) ? (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline"
                            >
                              {isExpanded ? 'Tutup' : 'Lihat Diff'}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={6} className="p-4 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <span className="text-slate-400 font-bold block mb-1">Nilai Lama (Old):</span>
                                <pre className="text-[11px] text-slate-700 whitespace-pre-wrap">
                                  {JSON.stringify(log.old_values, null, 2) || 'null'}
                                </pre>
                              </div>
                              <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <span className="text-emerald-600 font-bold block mb-1">Nilai Baru (New):</span>
                                <pre className="text-[11px] text-slate-700 whitespace-pre-wrap">
                                  {JSON.stringify(log.new_values, null, 2) || 'null'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Hal. {currentPage} dari {totalPages} ({totalCount} data)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
