import React, { useEffect, useState } from 'react'
import {
  PlusCircle,
  UserPlus,
  Trash2,
  Crown,
} from 'lucide-react'
import { participantService } from '../../services/participantService'
import type { Team } from '../../types/participant'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'

export const TeamsPage: React.FC = () => {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create team form modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Add member state per team
  const [addingToTeamId, setAddingToTeamId] = useState<number | null>(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [memberActionError, setMemberActionError] = useState<string | null>(null)
  const [memberActionSuccess, setMemberActionSuccess] = useState<string | null>(null)

  const fetchTeams = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await participantService.getTeams()
      setTeams(res.data || [])
    } catch (err) {
      console.error('Failed to load teams:', err)
      setError('Gagal memuat daftar tim peserta.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!newTeamName.trim()) {
      setCreateError('Nama tim wajib diisi.')
      return
    }

    setIsCreating(true)
    try {
      await participantService.createTeam(newTeamName.trim())
      setNewTeamName('')
      setShowCreateModal(false)
      await fetchTeams()
    } catch (err: any) {
      console.error('Failed to create team:', err)
      setCreateError(
        err.response?.data?.errors?.name?.[0] ||
        err.response?.data?.message ||
        'Gagal membuat tim baru.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddMember = async (teamId: number) => {
    setMemberActionError(null)
    setMemberActionSuccess(null)

    if (!memberEmail.trim()) {
      setMemberActionError('Alamat email anggota wajib diisi.')
      return
    }

    setIsAddingMember(true)
    try {
      await participantService.addTeamMember(teamId, memberEmail.trim())
      setMemberActionSuccess(`Pengguna ${memberEmail} berhasil ditambahkan ke dalam tim.`)
      setMemberEmail('')
      setAddingToTeamId(null)
      await fetchTeams()
    } catch (err: any) {
      console.error('Failed to add team member:', err)
      setMemberActionError(
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Gagal menambahkan anggota tim.'
      )
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (teamId: number, memberId: number, memberName: string) => {
    if (!window.confirm(`Keluarkan ${memberName} dari keanggotaan tim?`)) {
      return
    }

    setMemberActionError(null)
    try {
      await participantService.removeTeamMember(teamId, memberId)
      await fetchTeams()
    } catch (err: any) {
      console.error('Failed to remove team member:', err)
      alert(err.response?.data?.message || 'Gagal menghapus anggota tim.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Tim Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bentuk tim, tambahkan anggota melalui email terdaftar, dan kelola keikutsertaan lomba beregu.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Buat Tim Baru
        </Button>
      </div>

      {/* Global Alerts */}
      {memberActionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{memberActionSuccess}</span>
          <button onClick={() => setMemberActionSuccess(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {memberActionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{memberActionError}</span>
          <button onClick={() => setMemberActionError(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={fetchTeams} />
      ) : isLoading ? (
        <CardSkeleton count={2} />
      ) : teams.length === 0 ? (
        <EmptyState
          title="Belum Ada Tim"
          description="Anda belum memiliki tim untuk mengikuti kompetisi beregu. Buat tim baru sekarang."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Buat Tim Pertama Anda
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {teams.map((team) => {
            const isLeader = team.leader?.id === user?.id
            const isAddingHere = addingToTeamId === team.id

            return (
              <Card key={team.id} className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg text-slate-900">{team.name}</h3>
                      <Badge variant={isLeader ? 'primary' : 'default'} size="sm">
                        {isLeader ? 'Ketua Tim' : 'Anggota'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Kode Tim:</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {team.team_code}
                      </span>
                    </p>
                  </div>

                  {isLeader && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingToTeamId(isAddingHere ? null : team.id)}
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      {isAddingHere ? 'Tutup Form' : 'Tambah Anggota'}
                    </Button>
                  )}
                </div>

                {/* Add Member Form Drawer */}
                {isAddingHere && (
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      Tambah Anggota ke Tim "{team.name}"
                    </h4>
                    <p className="text-xs text-slate-500">
                      Anggota yang ditambahkan harus sudah memiliki akun terdaftar di sistem.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="Ketik alamat email anggota..."
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isAddingMember}
                        onClick={() => handleAddMember(team.id)}
                      >
                        Kirim Tambahkan
                      </Button>
                    </div>
                  </div>
                )}

                {/* Member Roster */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Daftar Anggota ({team.members?.length ?? 1} Orang)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.members?.map((member) => {
                      const isSelf = member.id === user?.id
                      const isMemberLeader = member.member_role === 'leader' || member.id === team.leader?.id

                      return (
                        <div
                          key={member.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {isMemberLeader && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              <span className="font-bold text-slate-900 truncate">
                                {member.name} {isSelf && '(Anda)'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                            {member.profile?.institution && (
                              <p className="text-[10px] text-slate-500 truncate">
                                {member.profile.institution}
                              </p>
                            )}
                          </div>

                          {isLeader && !isMemberLeader && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(team.id, member.id, member.name)}
                              className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Keluarkan dari tim"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Buat Tim Baru</h3>
            <p className="text-xs text-slate-500">
              Anda akan otomatis terdaftar sebagai Ketua Tim. Setelah dibuat, Anda dapat mengundang rekan anggota melalui email.
            </p>

            {createError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Tim</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Contoh: Garuda Tech Innovator"
                  required
                  minLength={3}
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                  Buat Tim
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
