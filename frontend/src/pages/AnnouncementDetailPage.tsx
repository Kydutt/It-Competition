import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { publicService } from '../services/publicService'
import type { Announcement } from '../types/public'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/ErrorState'

export const AnnouncementDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()

  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await publicService.getAnnouncementBySlug(slug)
      setAnnouncement(res.data)
    } catch (err) {
      console.error('Failed to load announcement detail:', err)
      setError('Pengumuman tidak ditemukan atau belum dipublikasikan.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [slug])

  if (isLoading) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !announcement) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <ErrorState
            title="Pengumuman Tidak Ditemukan"
            message={error || 'Pengumuman yang Anda cari tidak tersedia.'}
            onRetry={fetchDetail}
          />
          <div className="text-center mt-6">
            <Link to="/announcements">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar Pengumuman
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Back */}
        <div className="flex items-center justify-between">
          <Link
            to="/announcements"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#17243A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Semua Pengumuman</span>
          </Link>
        </div>

        {/* Article Container */}
        <Card className="p-6 sm:p-10 lg:p-12 space-y-6 bg-[#FFFEFA]">
          {/* Header metadata */}
          <div className="space-y-4 border-b border-[#E9E5DA] pb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4CE] text-[#17243A] border border-[#F5C842]/40">
                Warta Resmi
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
                <Clock className="w-3.5 h-3.5 text-[#E8AD22]" />
                <span>
                  {new Date(announcement.published_at || announcement.created_at).toLocaleDateString(
                    'id-ID',
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }
                  )}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#17243A] tracking-tight leading-snug">
              {announcement.title}
            </h1>
          </div>

          {/* Body Content */}
          <div className="text-sm sm:text-base text-[#17243A]/90 leading-relaxed whitespace-pre-line space-y-4">
            {announcement.content}
          </div>

          {/* Footer Card */}
          <div className="pt-6 border-t border-[#E9E5DA] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#64748B]">
              Diterbitkan oleh: <strong>Sekretariat Panitia IT COMP 2026</strong>
            </span>
            <Link to="/announcements">
              <Button variant="outline" size="sm">
                Lihat Pengumuman Lainnya
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
