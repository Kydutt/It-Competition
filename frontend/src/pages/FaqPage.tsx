import React, { useEffect, useState, useMemo } from 'react'
import { HelpCircle, Mail, Phone, MessageSquare } from 'lucide-react'
import { publicService } from '../services/publicService'
import type { Faq } from '../types/public'
import { Accordion } from '../components/ui/Accordion'
import { SearchInput } from '../components/ui/SearchInput'
import { Card } from '../components/ui/Card'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Button } from '../components/ui/Button'

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFaqs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await publicService.getFaqs()
      setFaqs(res.data || [])
    } catch (err) {
      console.error('Failed to load FAQs:', err)
      setError('Gagal memuat daftar FAQ. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    faqs.forEach((f) => {
      if (f.category) set.add(f.category)
    })
    return ['Semua', ...Array.from(set)]
  }, [faqs])

  // Filter faqs by search & category
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Semua' || item.category === selectedCategory
      const query = search.toLowerCase().trim()
      const matchesSearch =
        query === '' ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [faqs, selectedCategory, search])

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Banner */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF4CE] border border-[#F5C842]/40 text-[#17243A] text-xs font-bold tracking-wider uppercase shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-[#E8AD22]" />
            <span>PUSAT BANTUAN &amp; INFORMASI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#17243A] tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Temukan jawaban atas berbagai pertanyaan umum terkait regulasi, proses pendaftaran tim, kriteria karya, dan mekanisme seleksi.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#FFFEFA] rounded-2xl border border-[#E9E5DA] p-5 sm:p-7 shadow-xs space-y-4">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Ketik kata kunci pertanyaan..."
          />

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#E9E5DA]">
              <span className="text-xs font-bold text-[#17243A] shrink-0 mr-1">Kategori:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#17243A] text-[#FFFEFA]'
                      : 'bg-[#FAF9F5] border border-[#E9E5DA] text-[#64748B] hover:text-[#17243A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        {error ? (
          <ErrorState message={error} onRetry={fetchFaqs} />
        ) : isLoading ? (
          <CardSkeleton count={4} />
        ) : filteredFaqs.length === 0 ? (
          <EmptyState
            title="Tidak Ada Pertanyaan Ditemukan"
            description="Coba ubah kata kunci pencarian Anda atau hubungi narahubung panitia untuk bantuan langsung."
            action={
              (search || selectedCategory !== 'Semua') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setSelectedCategory('Semua')
                  }}
                >
                  Reset Pencarian
                </Button>
              )
            }
          />
        ) : (
          <Accordion
            items={filteredFaqs.map((f) => ({
              id: f.id,
              title: f.question,
              content: f.answer,
              category: f.category,
            }))}
            defaultOpenId={filteredFaqs[0]?.id}
          />
        )}

        {/* Contact Helpdesk Card */}
        <Card className="p-8 sm:p-10 bg-[#FFF4CE] border-[#F5C842]/40 text-center space-y-4 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFEFA] border border-[#F5C842] flex items-center justify-center text-[#17243A] mx-auto shadow-xs">
            <MessageSquare className="w-6 h-6 text-[#E8AD22]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#17243A]">Masih Memiliki Pertanyaan Lain?</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Tim panitia pelaksana siap membantu menjawab kendala teknis dan administrasi Anda.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a href="mailto:panitia@itcomp.test">
              <Button variant="secondary" size="sm" className="font-bold" leftIcon={<Mail className="w-4 h-4" />}>
                Email Panitia
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="font-bold bg-[#FFFEFA]"
              leftIcon={<Phone className="w-4 h-4" />}
              onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
            >
              WhatsApp Helpdesk
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
