import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Megaphone, Clock, ChevronRight } from 'lucide-react'
import { publicService } from '../services/publicService'
import type { Announcement } from '../types/public'
import { Card } from '../components/ui/Card'
import { Pagination } from '../components/ui/Pagination'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'

export const AnnouncementsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 9,
    total: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  const fetchAnnouncements = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await publicService.getAnnouncements(currentPage, 9)
      setAnnouncements(res.data || [])
      if (res.meta) {
        setPagination({
          currentPage: res.meta.current_page,
          lastPage: res.meta.last_page,
          perPage: res.meta.per_page,
          total: res.meta.total,
        })
      }
    } catch (err) {
      console.error('Failed to load announcements:', err)
      setError('Gagal memuat pengumuman resmi. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [searchParams])

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', newPage.toString())
    setSearchParams(next)
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Banner */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF4CE] border border-[#F5C842]/40 text-[#17243A] text-xs font-bold tracking-wider uppercase shadow-2xs">
            <Megaphone className="w-3.5 h-3.5 text-[#E8AD22]" />
            <span>PEMBERITAHUAN RESMI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#17243A] tracking-tight">
            Pengumuman &amp; Berita
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Dapatkan informasi terverifikasi, pembaruan jadwal, dan regulasi resmi langsung dari sekretariat panitia pelaksana.
          </p>
        </div>

        {/* Content Section */}
        {error ? (
          <ErrorState message={error} onRetry={fetchAnnouncements} />
        ) : isLoading ? (
          <CardSkeleton count={6} />
        ) : announcements.length === 0 ? (
          <EmptyState
            title="Belum Ada Pengumuman"
            description="Informasi resmi terkini akan segera diterbitkan di halaman ini."
          />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.map((ann) => (
                <Card key={ann.id} hoverable className="p-7 flex flex-col justify-between space-y-5 bg-[#FFFEFA]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Clock className="w-3.5 h-3.5 text-[#E8AD22]" />
                      <span>
                        {new Date(ann.published_at || ann.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold text-[#17243A] leading-snug line-clamp-2">
                      {ann.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-[#64748B] line-clamp-3 leading-relaxed">
                      {ann.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E9E5DA]">
                    <Link
                      to={`/announcements/${ann.slug}`}
                      className="text-xs font-bold text-[#17243A] hover:text-[#E8AD22] inline-flex items-center gap-1 transition-colors"
                    >
                      Baca Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.currentPage}
              lastPage={pagination.lastPage}
              perPage={pagination.perPage}
              total={pagination.total}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
