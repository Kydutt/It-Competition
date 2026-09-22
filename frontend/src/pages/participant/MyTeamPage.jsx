import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const MyTeamPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultCompId = searchParams.get('competition_id') || '';

  const [teams, setTeams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / forms
  const [showCreate, setShowCreate] = useState(Boolean(defaultCompId));
  const [showJoin, setShowJoin] = useState(false);
  const [transferModal, setTransferModal] = useState({ open: false, team: null, selectedUserId: '' });

  // Inputs
  const [createData, setCreateData] = useState({
    name: '',
    competition_id: defaultCompId,
    institution: user?.institution || '',
  });
  const [joinCode, setJoinCode] = useState('');

  // States
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchTeamsAndCompetitions = async () => {
    try {
      setLoading(true);
      const [teamRes, compRes] = await Promise.all([
        registrationService.getTeams(),
        api.get('/competitions'),
      ]);

      if (teamRes?.data) setTeams(teamRes.data || []);
      if (compRes.data?.success) {
        // filter only team-based competitions
        const teamComps = (compRes.data.data || []).filter(c => c.competition_type === 'team');
        setCompetitions(teamComps);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndCompetitions();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setAlert(null);
      const res = await registrationService.createTeam(createData);
      if (res?.success) {
        setAlert({ type: 'success', message: 'Tim berhasil dibentuk! Bagikan kode tim kepada calon anggota Anda.' });
        setShowCreate(false);
        setCreateData({ name: '', competition_id: '', institution: user?.institution || '' });
        await fetchTeamsAndCompetitions();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Gagal membuat tim.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setAlert(null);
      const res = await registrationService.joinTeam(joinCode.trim().toUpperCase());
      if (res?.success) {
        setAlert({ type: 'success', message: 'Selamat! Anda berhasil bergabung ke dalam tim.' });
        setShowJoin(false);
        setJoinCode('');
        await fetchTeamsAndCompetitions();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0] || 'Gagal bergabung ke tim.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTeam = async (team) => {
    if (!window.confirm(`Apakah Anda yakin ingin keluar dari tim "${team.name}"?`)) return;

    try {
      setAlert(null);
      await registrationService.leaveTeam(team.id);
      setAlert({ type: 'info', message: `Anda telah keluar dari tim "${team.name}".` });
      await fetchTeamsAndCompetitions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal keluar dari tim.';
      setAlert({ type: 'danger', message: msg });
    }
  };

  const handleRemoveMember = async (team, member) => {
    if (!window.confirm(`Keluarkan ${member.name} dari tim "${team.name}"?`)) return;

    try {
      setAlert(null);
      await registrationService.removeTeamMember(team.id, member.user_id);
      setAlert({ type: 'info', message: `${member.name} berhasil dikeluarkan dari tim.` });
      await fetchTeamsAndCompetitions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengeluarkan anggota.';
      setAlert({ type: 'danger', message: msg });
    }
  };

  const handleTransferLeadership = async (e) => {
    e.preventDefault();
    if (!transferModal.selectedUserId) return;

    try {
      setSubmitting(true);
      setAlert(null);
      await registrationService.transferLeadership(transferModal.team.id, transferModal.selectedUserId);
      setAlert({ type: 'success', message: 'Kepemimpinan tim berhasil dialihkan!' });
      setTransferModal({ open: false, team: null, selectedUserId: '' });
      await fetchTeamsAndCompetitions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengalihkan kepemimpinan.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDissolveTeam = async (team) => {
    if (!window.confirm(`PERINGATAN: Membubarkan tim "${team.name}" akan menghapus seluruh data tim ini. Lanjutkan?`)) return;

    try {
      setAlert(null);
      await registrationService.dissolveTeam(team.id);
      setAlert({ type: 'info', message: `Tim "${team.name}" berhasil dibubarkan.` });
      await fetchTeamsAndCompetitions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membubarkan tim.';
      setAlert({ type: 'danger', message: msg });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Manajemen Tim Kompetisi</h2>
          <p className="text-sm text-gray-500">Bentuk tim baru, undang rekan satu instansi dengan kode tim, atau gabung ke tim yang sudah ada</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowJoin(!showJoin);
              setShowCreate(false);
            }}
          >
            {showJoin ? 'Tutup' : '🔑 Gabung Tim (Kode)'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowCreate(!showCreate);
              setShowJoin(false);
            }}
          >
            {showCreate ? 'Tutup Form' : '+ Bentuk Tim Baru'}
          </Button>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* JOIN TEAM MODAL / ACCORDION */}
      {showJoin && (
        <Card className="border-brand-300 bg-brand-50/20">
          <CardHeader>
            <CardTitle>Gabung ke Tim yang Sudah Ada</CardTitle>
            <CardDescription>Masukkan kode unik tim (contoh: HITC-A7K29) yang diberikan oleh ketua tim Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinTeam} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <Input
                  label="Kode Undangan Tim"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: HITC-WEB01"
                  className="font-mono uppercase tracking-widest text-base font-bold"
                />
              </div>
              <Button type="submit" variant="primary" disabled={submitting || !joinCode.trim()}>
                {submitting ? 'Memproses...' : 'Gabung Sekarang'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* CREATE TEAM FORM */}
      {showCreate && (
        <Card className="border-brand-400">
          <CardHeader>
            <CardTitle>Bentuk Tim Kompetisi Baru</CardTitle>
            <CardDescription>Sebagai pembuat tim, Anda akan otomatis ditetapkan sebagai Ketua Tim.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Tim"
                  required
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="Contoh: Syntax Squad"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cabang Lomba</label>
                  <select
                    required
                    value={createData.competition_id}
                    onChange={(e) => setCreateData({ ...createData, competition_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Pilih Cabang Kompetisi --</option>
                    {competitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.title} ({c.target_level === 'university' ? 'Mahasiswa' : 'SMA/SMK'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Asal Instansi / Universitas / Sekolah"
                required
                value={createData.institution}
                onChange={(e) => setCreateData({ ...createData, institution: e.target.value })}
                placeholder="Contoh: Universitas Swadaya Gunung Jati"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Bentuk Tim'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TRANSFER LEADERSHIP MODAL */}
      {transferModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Alihkan Kepemimpinan Tim</h3>
            <p className="text-xs text-gray-600">
              Pilih anggota tim "{transferModal.team?.name}" yang akan dijadikan ketua baru. Anda akan menjadi anggota biasa.
            </p>

            <form onSubmit={handleTransferLeadership} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Calon Ketua Baru</label>
                <select
                  required
                  value={transferModal.selectedUserId}
                  onChange={(e) => setTransferModal({ ...transferModal, selectedUserId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Pilih Anggota --</option>
                  {transferModal.team?.members
                    ?.filter((m) => m.user_id !== user?.id)
                    .map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setTransferModal({ open: false, team: null, selectedUserId: '' })}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting || !transferModal.selectedUserId}>
                  {submitting ? 'Memproses...' : 'Konfirmasi Alihkan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM LISTING */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat data tim Anda...</p>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <div className="text-center py-14 space-y-4">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              👥
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-gray-900">Belum Ada Tim</h3>
              <p className="text-xs text-gray-500 mt-1">
                Anda belum bergabung atau membuat tim kompetisi. Buat tim baru atau minta kode undangan dari ketua tim Anda.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>
                Gabung dengan Kode
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                Bentuk Tim Sekarang
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => {
            const isLeader = team.leader_id === user?.id;
            const isLocked = team.is_locked;
            const minMembers = team.competition?.min_team_member || 1;
            const maxMembers = team.competition?.max_team_member || 3;
            const currentMembersCount = team.members?.length || team.members_count || 1;
            const isFull = currentMembersCount >= maxMembers;
            const hasMinMembers = currentMembersCount >= minMembers;

            return (
              <Card key={team.id} className="overflow-hidden border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary">{team.competition?.title || team.competition?.name || 'Kompetisi'}</Badge>
                      {isLeader ? (
                        <Badge variant="success">Ketua Tim</Badge>
                      ) : (
                        <Badge variant="default">Anggota</Badge>
                      )}
                      {isLocked ? (
                        <Badge variant="warning">🔒 Keanggotaan Terkunci</Badge>
                      ) : (
                        <Badge variant="info">Pendaftaran Terbuka</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-black text-gray-950">{team.name}</CardTitle>
                    <p className="text-xs text-gray-500">{team.institution}</p>
                  </div>

                  {/* INVITE CODE BADGE & ACTION */}
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                        Kode Undangan Tim
                      </span>
                      <span className="font-mono text-base font-extrabold text-brand-700 tracking-wider">
                        {team.code}
                      </span>
                    </div>
                    <Button
                      variant={copiedCode === team.code ? 'success' : 'secondary'}
                      size="sm"
                      onClick={() => handleCopyCode(team.code)}
                      className="text-xs px-2.5 py-1"
                    >
                      {copiedCode === team.code ? '✓ Tersalin' : 'Salin'}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* LOCK NOTICE */}
                  {isLocked && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <span className="text-base">🔒</span>
                      <div>
                        <strong className="block font-semibold">Keanggotaan Tim Dikunci</strong>
                        Pendaftaran tim ini sedang ditinjau atau telah disetujui panitia. Anggota tidak dapat ditambah, dikeluarkan, atau keluar dari tim.
                      </div>
                    </div>
                  )}

                  {/* MEMBERS SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Daftar Anggota</h4>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {currentMembersCount} / {maxMembers} orang
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        Syarat pendaftaran: Min {minMembers} - Maks {maxMembers} orang
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4 font-semibold">Nama Lengkap</th>
                            <th className="py-2.5 px-4 font-semibold">Kontak</th>
                            <th className="py-2.5 px-4 font-semibold">Instansi / Jenjang</th>
                            <th className="py-2.5 px-4 font-semibold">Peran</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {team.members?.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {member.name} {member.user_id === user?.id && <span className="text-brand-600 font-bold">(Anda)</span>}
                              </td>
                              <td className="py-3 px-4 text-gray-500">
                                <div>{member.email}</div>
                                <div className="text-[11px] text-gray-400">{member.phone || '-'}</div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                <div>{member.institution || '-'}</div>
                                <span className="text-[10px] uppercase font-bold text-gray-400">{member.education_level || '-'}</span>
                              </td>
                              <td className="py-3 px-4">
                                {member.role === 'leader' ? (
                                  <Badge variant="success">Ketua</Badge>
                                ) : (
                                  <Badge variant="default">Anggota</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isLeader && !isLocked && member.user_id !== user?.id && (
                                  <button
                                    onClick={() => handleRemoveMember(team, member)}
                                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                                  >
                                    Keluarkan
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                      {isLeader && !isLocked && (
                        <>
                          {currentMembersCount > 1 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setTransferModal({ open: true, team, selectedUserId: '' })}
                            >
                              Alihkan Kepemimpinan
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDissolveTeam(team)}
                          >
                            Bubarkan Tim
                          </Button>
                        </>
                      )}

                      {!isLeader && !isLocked && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleLeaveTeam(team)}
                        >
                          Keluar dari Tim
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {team.registration ? (
                        <Link to={`/registrations`}>
                          <Button variant="secondary" size="sm">
                            Status Registrasi: {team.registration.status_label || team.registration.status}
                          </Button>
                        </Link>
                      ) : isLeader ? (
                        hasMinMembers ? (
                          <Link to="/registrations">
                            <Button variant="primary" size="sm">
                              Daftarkan Tim ke Lomba ➔
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-amber-600 font-semibold flex items-center">
                            Kurang {minMembers - currentMembersCount} anggota lagi untuk mendaftar
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">
                          Menunggu pendaftaran diajukan oleh ketua tim
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTeamPage;
