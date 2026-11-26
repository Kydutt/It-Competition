import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  PlusCircle,
} from 'lucide-react'
import { publicService } from '../../services/publicService'
import { participantService } from '../../services/participantService'
import { formatCompetitionFee } from '../../utils/currency'
import type { Competition } from '../../types/public'
import type { Team } from '../../types/participant'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'

export const RegistrationCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const preselectedSlug = searchParams.get('competition')

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [compRes, teamRes] = await Promise.all([
          publicService.getCompetitions({ per_page: 50 }),
          participantService.getTeams(),
        ])

        const openComps = (compRes.data || []).filter(
          (c) => c.status === 'registration_open'
        )
        setCompetitions(openComps)
        setTeams(teamRes.data || [])

        if (preselectedSlug) {
          const matched = openComps.find((c) => c.slug === preselectedSlug)
          if (matched) {
            setSelectedCompetitionId(matched.id)
          }
        } else if (openComps.length > 0) {
          setSelectedCompetitionId(openComps[0].id)
        }
      } catch (err) {
        console.error('Failed to load options:', err)
        setErrorMessage('Gagal memuat data kompetisi atau tim.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [preselectedSlug])

  const selectedCompetition = competitions.find((c) => c.id === selectedCompetitionId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedCompetitionId) {
      setErrorMessage('Harap pilih cabang kompetisi yang ingin diikuti.')
      return
    }

    if (selectedCompetition?.registration_type === 'team' && !selectedTeamId) {
      setErrorMessage('Kompetisi ini beregu. Anda wajib memilih tim.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await participantService.createRegistrationDraft({
        competition_id: selectedCompetitionId,
        team_id: selectedCompetition?.registration_type === 'team' ? selectedTeamId : null,
        notes: notes.trim() || undefined,
      })

      // Redirect to detail page to upload required documents
      navigate(`/participant/registrations/${res.data.id}`)
    } catch (err: any) {
      console.error('Failed to create registration draft:', err)
      const msg =
        err.response?.data?.errors?.team_id?.[0] ||
        err.response?.data?.errors?.competition?.[0] ||
        err.response?.data?.message ||
        'Gagal membuat draf pendaftaran.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <CardSkeleton count={2} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/participant/registrations" className="hover:text-slate-800">
          Pendaftaran Saya
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">Daftar Kompetisi Baru</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Formulir Pendaftaran Kompetisi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Pilih cabang lomba yang ingin Anda ikuti, tentukan tim (jika beregu), lalu lengkapi berkas persyaratan.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Competition */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 block">
              1. Pilih Cabang Kompetisi <span className="text-red-500">*</span>
            </label>
            {competitions.length === 0 ? (
              <p className="text-xs text-slate-500">Tidak ada kompetisi yang sedang membuka pendaftaran.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {competitions.map((comp) => {
                  const isSelected = selectedCompetitionId === comp.id
                  return (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedCompetitionId(comp.id)
                        setSelectedTeamId(null)
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--color-brand-orange)] bg-orange-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{comp.name}</span>
                            <Badge variant={comp.registration_type === 'team' ? 'default' : 'primary'}>
                              {comp.registration_type === 'team'
                                ? `Tim (${comp.min_members}-${comp.max_members} org)`
                                : 'Individu'}
                            </Badge>
                            <Badge variant={Number(comp.registration_fee) > 0 ? 'info' : 'success'}>
                              {formatCompetitionFee(comp.registration_fee)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {comp.short_description}
                          </p>
                          <div className="text-[11px] text-slate-500 pt-1">
                            Batas Pendaftaran:{' '}
                            <span className="font-semibold text-slate-700">
                              {comp.registration_deadline
                                ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 border-slate-300">
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-orange)]" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Step 2: Format / Team selection if Team mode */}
          {selectedCompetition?.registration_type === 'team' && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900 block">
                  2. Pilih Tim Anda <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/participant/teams"
                  className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline inline-flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Buat Tim Baru</span>
                </Link>
              </div>

              {teams.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600">Anda belum memiliki tim terdaftar.</p>
                  <Link to="/participant/teams">
                    <Button variant="outline" size="sm">
                      Buat Tim Sekarang
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.map((t) => {
                    const isSelected = selectedTeamId === t.id
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeamId(t.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[var(--color-brand-blue)] bg-blue-50/50 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-slate-900">{t.name}</p>
                            <p className="text-xs text-slate-500">
                              Kode: <span className="font-mono">{t.team_code}</span> •{' '}
                              {t.members_count || t.members?.length || 1} Anggota
                            </p>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)]" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Optional Notes */}
          <div className="space-y-1.5 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Catatan Pendaftaran (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan catatan khusus atau informasi tambahan jika diperlukan..."
              rows={3}
              className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link to="/participant/registrations">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="font-bold shadow-xs"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Lanjutkan ke Unggah Berkas
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
