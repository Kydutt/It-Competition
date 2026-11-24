import React, { useEffect, useState } from 'react'
import { CheckCheck, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { participantService } from '../../services/participantService'
import type { NotificationItem } from '../../types/participant'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await participantService.getNotifications()
      setNotifications(res.data || [])
      if (res.meta && typeof res.meta.unread_count === 'number') {
        setUnreadCount(res.meta.unread_count)
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Gagal memuat daftar notifikasi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkRead = async (id: number) => {
    try {
      await participantService.markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await participantService.markAllNotificationsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes('approved') || type.includes('verified')) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    }
    if (type.includes('revision') || type.includes('rejected')) {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />
    }
    return <Info className="w-5 h-5 text-[var(--color-brand-blue)]" />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifikasi Akun
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pemberitahuan resmi mengenai pembaruan status pendaftaran, verifikasi berkas, dan instruksi panitia.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
          >
            Tandai Semua Dibaca ({unreadCount})
          </Button>
        )}
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : isLoading ? (
        <CardSkeleton count={3} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Belum Ada Notifikasi"
          description="Pemberitahuan aktivitas pendaftaran Anda akan muncul di sini."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card
              key={item.id}
              className={`p-5 transition-colors ${
                !item.is_read
                  ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                  : 'bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </div>
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item.id)}
                    className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline shrink-0 cursor-pointer"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
