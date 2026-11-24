import React, { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Video, ExternalLink, CalendarDays } from 'lucide-react'
import { publicService } from '../services/publicService'
import type { Schedule } from '../types/public'
import { Card } from '../components/ui/Card'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'

export const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await publicService.getSchedules()
      setSchedules(res.data || [])
    } catch (err) {
      console.error('Failed to load schedules:', err)
      setError('Gagal memuat jadwal kegiatan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF4CE] border border-[#F5C842]/40 text-[#17243A] text-xs font-bold tracking-wider uppercase shadow-2xs">
            <CalendarDays className="w-3.5 h-3.5 text-[#E8AD22]" />
            <span>TIMELINE PELAKSANAAN RESMI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#17243A] tracking-tight">
            Jadwal &amp; Agenda Kegiatan
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Berikut rangkaian agenda resmi IT Festival 2026. Seluruh waktu mengacu pada Waktu Indonesia Barat (WIB, Asia/Jakarta).
          </p>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchSchedules} />
        ) : isLoading ? (
          <div className="space-y-4">
            <CardSkeleton count={3} />
          </div>
        ) : schedules.length === 0 ? (
          <EmptyState
            title="Belum Ada Jadwal Tersedia"
            description="Jadwal resmi perlombaan akan segera dipublikasikan oleh panitia."
          />
        ) : (
          <div className="relative border-l-2 border-[#F5C842] ml-4 sm:ml-6 space-y-8 py-4">
            {schedules.map((item, index) => {
              const startDate = new Date(item.start_at)
              const endDate = item.end_at ? new Date(item.end_at) : null
              const isPast = endDate ? endDate < new Date() : startDate < new Date()

              return (
                <div key={item.id} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-[#FAF9F5] transition-colors ${
                      isPast ? 'bg-[#17243A]' : 'bg-[#F5C842]'
                    }`}
                  />

                  <Card hoverable className="p-6 sm:p-7 space-y-4 bg-[#FFFEFA]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#E8AD22] tracking-wider uppercase">
                        Tahap {index + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF9F5] border border-[#E9E5DA] text-[#64748B]">
                        {isPast ? 'Selesai' : 'Mendatang'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-lg sm:text-xl font-black text-[#17243A] leading-snug">
                        {item.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata Badges */}
                    <div className="pt-3 border-t border-[#E9E5DA] flex flex-wrap items-center gap-4 text-xs font-semibold text-[#17243A]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#E8AD22]" />
                        <span>
                          {startDate.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#E8AD22]" />
                        <span>
                          {startDate.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                          {endDate &&
                            ` - ${endDate.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} WIB`}
                        </span>
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-1.5 text-[#64748B]">
                          <MapPin className="w-4 h-4 text-[#E8AD22]" />
                          <span>{item.location}</span>
                        </div>
                      )}

                      {item.meeting_url && (
                        <a
                          href={item.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#17243A] hover:text-[#E8AD22] font-bold"
                        >
                          <Video className="w-4 h-4 text-sky-600" />
                          <span>Tautan Online</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
