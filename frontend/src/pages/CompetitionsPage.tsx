import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Trophy, Filter } from 'lucide-react'
import { publicService } from '../services/publicService'
import type { Competition, CompetitionCategory } from '../types/public'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'

export const CompetitionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [categories, setCategories] = useState<CompetitionCategory[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 9,
    total: 0,
  })

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Fetch categories on mount
  useEffect(() => {
    publicService
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error('Failed to load categories:', err))
  }, [])

  // Fetch competitions on filter/page change
  const fetchCompetitions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await publicService.getCompetitions({
        page: currentPage,
        per_page: 9,
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        type: searchParams.get('type') || undefined,
      })

      setCompetitions(res.data || [])
      if (res.meta) {
        setPagination({
          currentPage: res.meta.current_page,
          lastPage: res.meta.last_page,
          perPage: res.meta.per_page,
          total: res.meta.total,
        })
      }
    } catch (err) {
      console.error('Failed to fetch competitions:', err)
      setError('Gagal memuat katalog kompetisi. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompetitions()
  }, [searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (search.trim()) {
      next.set('search', search.trim())
    } else {
      next.delete('search')
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleClearSearch = () => {
    setSearch('')
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug)
    const next = new URLSearchParams(searchParams)
    if (slug) {
      next.set('category', slug)
    } else {
      next.delete('category')
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    const next = new URLSearchParams(searchParams)
    if (type) {
      next.set('type', type)
    } else {
      next.delete('type')
    }
    next.set('page', '1')
    setSearchParams(next)
  }

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
            <Trophy className="w-3.5 h-3.5 text-[#E8AD22]" />
            <span>KATALOG RESMI IT COMP 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#17243A] tracking-tight">
            Pilihan Cabang Kompetisi
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Temukan cabang lomba yang sesuai dengan minat dan keahlianmu. Dapatkan pengalaman berharga, validasi kemampuan teknis, dan raih penghargaan nasional.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#FFFEFA] rounded-2xl border border-[#E9E5DA] p-5 sm:p-7 shadow-xs space-y-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={handleClearSearch}
                placeholder="Cari nama kompetisi atau deskripsi..."
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="font-bold shrink-0">
              Cari Kompetisi
            </Button>
          </form>

          {/* Categories Pills */}
          <div className="pt-3 border-t border-[#E9E5DA] flex items-center gap-2 overflow-x-auto sm:flex-wrap no-scrollbar pb-1">
            <span className="text-xs font-bold text-[#17243A] mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#E8AD22]" /> Kategori:
            </span>
            <button
              type="button"
              onClick={() => handleCategorySelect('')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                selectedCategory === ''
                  ? 'bg-[#17243A] text-[#FFFEFA]'
                  : 'bg-[#FAF9F5] border border-[#E9E5DA] text-[#64748B] hover:text-[#17243A]'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-[#17243A] text-[#FFFEFA]'
                    : 'bg-[#FAF9F5] border border-[#E9E5DA] text-[#64748B] hover:text-[#17243A]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Format Selection (Individu / Tim) */}
          <div className="flex items-center gap-2 text-xs overflow-x-auto sm:flex-wrap no-scrollbar">
            <span className="font-bold text-[#17243A] mr-1 shrink-0">Format:</span>
            <button
              type="button"
              onClick={() => handleTypeSelect('')}
              className={`px-3 py-1 rounded-full font-bold cursor-pointer shrink-0 whitespace-nowrap ${
                selectedType === ''
                  ? 'bg-[#F5C842] text-[#17243A]'
                  : 'bg-[#FAF9F5] border border-[#E9E5DA] text-[#64748B] hover:text-[#17243A]'
              }`}
            >
              Semua Format
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('team')}
              className={`px-3 py-1 rounded-full font-bold cursor-pointer shrink-0 whitespace-nowrap ${
                selectedType === 'team'
                  ? 'bg-[#F5C842] text-[#17243A]'
                  : 'bg-[#FAF9F5] border border-[#E9E5DA] text-[#64748B] hover:text-[#17243A]'
              }`}
            >
              Tim
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('individual')}
              className={`px-3 py-1 rounded-full font-bold cursor-pointer shrink-0 whitespace-nowrap ${
                selectedType === 'individual'
                  ? 'bg-[#F5C842] text-[#17243A]'
                  : 'bg-[#FAF9F5] border border-[#E9E5DA] text-[#64748B] hover:text-[#17243A]'
              }`}
            >
              Individu
            </button>
          </div>
        </div>

        {/* Content Section */}
        {error ? (
          <ErrorState message={error} onRetry={fetchCompetitions} />
        ) : isLoading ? (
          <CardSkeleton count={6} />
        ) : competitions.length === 0 ? (
          <EmptyState
            title="Tidak Ada Kompetisi Ditemukan"
            description="Coba sesuaikan kata kunci pencarian atau bersihkan filter kategori yang dipilih."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('')
                  setSelectedType('')
                  setSearchParams({})
                }}
              >
                Reset Semua Filter
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map((comp) => (
                <Card key={comp.id} hoverable className="p-7 flex flex-col justify-between space-y-5 bg-[#FFFEFA]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4CE] text-[#17243A] border border-[#F5C842]/40">
                        {comp.category?.name || 'Kompetisi IT'}
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        {comp.registration_type === 'team'
                          ? `Tim (${comp.min_members}-${comp.max_members} org)`
                          : 'Individu'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xl text-[#17243A] leading-snug">
                        {comp.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#64748B] line-clamp-3 leading-relaxed">
                        {comp.short_description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E9E5DA] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#64748B] block font-medium">Biaya Pendaftaran</span>
                      <span className="font-bold text-sm text-emerald-700">
                        {comp.registration_fee === 0 ? 'Gratis' : `Rp ${comp.registration_fee.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <Link to={`/competitions/${comp.slug}`}>
                      <Button variant="primary" size="sm" className="font-bold">
                        Detail Lomba
                      </Button>
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
