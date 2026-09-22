import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const RegistrationsPage = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  // New registration modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRegForm, setNewRegForm] = useState({ competition_id: '', team_id: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [regRes, compRes, teamRes] = await Promise.all([
        registrationService.getRegistrations(),
        api.get('/competitions'),
        registrationService.getTeams(),
      ]);

      if (regRes?.data) setRegistrations(regRes.data || []);
      if (compRes.data?.success) setCompetitions(compRes.data.data || []);
      if (teamRes?.data) setTeams(teamRes.data || []);
    } catch (err) {
      console.error('Failed to load registration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateRegistration = async (e) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      setAlert(null);
      const payload = {
        competition_id: parseInt(newRegForm.competition_id, 10),
      };
      if (newRegForm.team_id) {
        payload.team_id = parseInt(newRegForm.team_id, 10);
      }

      const res = await registrationService.createRegistration(payload);
      if (res?.success) {
        setAlert({
          type: 'success',
          message: 'Pendaftaran berhasil dibuat sebagai draf. Silakan tinjau dan klik "Submit Pendaftaran" saat berkas siap.',
        });
        setShowCreateModal(false);
        setNewRegForm({ competition_id: '', team_id: '' });
        await loadAllData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.competition_id?.[0] || 'Gagal membuat pendaftaran.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSubmitRegistration = async (reg) => {
    if (!window.confirm(`Submit pendaftaran ${reg.registration_number} untuk ditinjau oleh panitia?`)) return;

    try {
      setSubmittingId(reg.id);
      setAlert(null);
      const res = await registrationService.submitRegistration(reg.id);
      if (res?.success) {
        setAlert({
          type: 'success',
          message: `Pendaftaran ${reg.registration_number} berhasil disubmit! Panitia akan segera meninjau berkas Anda.`,
        });
        await loadAllData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.team?.[0] || 'Gagal mengirim pendaftaran.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelRegistration = async (reg) => {
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan pendaftaran ${reg.registration_number}?`)) return;

    try {
      setSubmittingId(reg.id);
      setAlert(null);
      const res = await registrationService.cancelRegistration(reg.id);
      if (res?.success) {
        setAlert({
          type: 'info',
          message: `Pendaftaran ${reg.registration_number} telah dibatalkan.`,
        });
        await loadAllData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membatalkan pendaftaran.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Disetujui (Approved)</Badge>;
      case 'rejected':
        return <Badge variant="danger">Ditolak (Rejected)</Badge>;
      case 'revision_required':
        return <Badge variant="warning">Perlu Revisi (Revision)</Badge>;
      case 'under_review':
        return <Badge variant="warning">Sedang Ditinjau</Badge>;
      case 'submitted':
        return <Badge variant="info">Diajukan (Submitted)</Badge>;
      case 'cancelled':
        return <Badge variant="default">Dibatalkan</Badge>;
      case 'draft':
      default:
        return <Badge variant="default">Draf (Belum Dikirim)</Badge>;
    }
  };

  const selectedCompetition = competitions.find((c) => c.id === parseInt(newRegForm.competition_id, 10));
  const isSelectedTeamBased = selectedCompetition?.competition_type === 'team';
  const eligibleTeams = teams.filter((t) => t.competition_id === selectedCompetition?.id && t.leader_id === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Status Pendaftaran Lomba</h2>
          <p className="text-sm text-gray-500">Pantau proses pengajuan berkas, revisi administrasi, dan status verifikasi lomba</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            + Daftarkan Kompetisi Baru
          </Button>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* CREATE REGISTRATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Mulai Pendaftaran Lomba</h3>
            <p className="text-xs text-gray-600">
              Pilih cabang lomba yang ingin Anda ikuti. Pendaftaran akan dibuat dalam status draf terlebih dahulu.
            </p>

            <form onSubmit={handleCreateRegistration} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cabang Kompetisi</label>
                <select
                  required
                  value={newRegForm.competition_id}
                  onChange={(e) => setNewRegForm({ competition_id: e.target.value, team_id: '' })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Pilih Cabang Kompetisi --</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title} ({c.competition_type === 'team' ? 'Tim' : 'Individu'}) - Rp {Number(c.registration_fee || 0).toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              {isSelectedTeamBased && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Tim Anda</label>
                  {eligibleTeams.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
                      <p>Anda belum menjadi ketua tim untuk cabang kompetisi ini.</p>
                      <Link to={`/my-team?competition_id=${selectedCompetition?.id}`}>
                        <Button type="button" variant="secondary" size="sm">
                          Bentuk Tim Terlebih Dahulu ➔
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <select
                      required
                      value={newRegForm.team_id}
                      onChange={(e) => setNewRegForm({ ...newRegForm, team_id: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">-- Pilih Tim Anda --</option>
                      {eligibleTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Kode: {t.code}) - {t.members?.length || t.members_count || 1} Anggota
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createSubmitting || !newRegForm.competition_id || (isSelectedTeamBased && !newRegForm.team_id)}
                >
                  {createSubmitting ? 'Memproses...' : 'Buat Draf Pendaftaran'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATIONS LIST */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat berkas pendaftaran...</p>
        </div>
      ) : registrations.length === 0 ? (
        <Card>
          <div className="text-center py-14 space-y-4">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              📝
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-gray-900">Belum Ada Pendaftaran</h3>
              <p className="text-xs text-gray-500 mt-1">
                Anda belum mendaftarkan diri atau tim ke cabang lomba manapun. Mulai pendaftaran sekarang!
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              Daftar Kompetisi Sekarang
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {registrations.map((reg) => {
            const isOwner = reg.user_id === user?.id;
            const isDraft = reg.status === 'draft';
            const isRevision = reg.status === 'revision_required';
            const isSubmitted = reg.status === 'submitted';
            const canSubmit = (isDraft || isRevision) && isOwner;
            const canCancel = (isDraft || isSubmitted) && isOwner;

            return (
              <Card key={reg.id} className="overflow-hidden border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded">
                        {reg.registration_number}
                      </span>
                      {getStatusBadge(reg.status)}
                      <Badge variant={reg.is_team_based ? 'info' : 'default'}>
                        {reg.is_team_based ? 'Kompetisi Tim' : 'Kompetisi Individu'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-950 mt-1">
                      {reg.competition?.title || reg.competition?.name || 'Cabang Kompetisi'}
                    </CardTitle>
                  </div>

                  <div className="text-right text-xs text-gray-400">
                    <div>Dibuat: {new Date(reg.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
                    {reg.submitted_at && (
                      <div className="text-brand-600 font-semibold">
                        Disubmit: {new Date(reg.submitted_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4 text-xs">
                  {/* REVISION NOTE BANNER */}
                  {reg.revision_note && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-1 text-amber-900">
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <span>⚠️</span> Catatan Panitia (Perlu Revisi):
                      </div>
                      <p className="text-xs leading-relaxed">{reg.revision_note}</p>
                      <p className="text-[11px] text-amber-700 pt-1">
                        Silakan perbaiki data atau berkas Anda, lalu klik "Ajukan Ulang Pendaftaran" di bawah.
                      </p>
                    </div>
                  )}

                  {/* REJECTION REASON BANNER */}
                  {reg.rejection_reason && (
                    <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg space-y-1 text-rose-900">
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <span>✕</span> Alasan Penolakan:
                      </div>
                      <p className="text-xs leading-relaxed">{reg.rejection_reason}</p>
                    </div>
                  )}

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/70 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Penanggung Jawab / Pendaftar:</span>
                      <span className="font-bold text-gray-900">{reg.user?.name}</span>
                      <div className="text-gray-500 text-[11px]">{reg.user?.email}</div>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Entitas Lomba:</span>
                      {reg.team ? (
                        <div>
                          <span className="font-bold text-gray-900">{reg.team.name}</span>
                          <div className="text-gray-500 text-[11px]">
                            Kode: <span className="font-mono font-bold text-blue-700">{reg.team.code}</span> ({reg.team.members?.length || 1} anggota)
                          </div>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900">Peserta Perorangan / Individu</span>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Biaya Registrasi:</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {reg.competition?.registration_fee > 0
                          ? `Rp ${Number(reg.competition.registration_fee).toLocaleString('id-ID')}`
                          : 'Gratis'}
                      </span>
                      {reg.reviewed_at && (
                        <div className="text-[11px] text-emerald-600 font-medium">
                          Diverifikasi: {new Date(reg.reviewed_at).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TEAM MEMBERS SUMMARY IF TEAM-BASED */}
                  {reg.team?.members && reg.team.members.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="font-semibold text-gray-700 block">Anggota Tim Terdaftar:</span>
                      <div className="flex flex-wrap gap-2">
                        {reg.team.members.map((m) => (
                          <div key={m.id} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-[11px] flex items-center gap-1.5 shadow-2xs">
                            <span className="font-medium text-gray-900">{m.name}</span>
                            <span className="text-gray-400 text-[10px]">({m.role === 'leader' ? 'Ketua' : 'Anggota'})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACTION BAR */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">
                      {isDraft && 'Draf pendaftaran belum diserahkan ke panitia.'}
                      {isSubmitted && 'Menunggu giliran peninjauan oleh tim verifikator panitia.'}
                      {reg.status === 'approved' && '✅ Berkas terverifikasi sah. Lanjutkan ke proses berikutnya.'}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {reg.status === 'approved' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/registrations/${reg.id}/payment`)}
                          >
                            {reg.is_payment_cleared ? 'Rincian Pembayaran' : 'Bayar / Konfirmasi Transfer 💳'}
                          </Button>

                          {reg.is_eligible_for_submission && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/registrations/${reg.id}/submission`)}
                              className="font-bold shadow-xs"
                            >
                              Kumpulkan Karya ➔
                            </Button>
                          )}
                        </>
                      )}

                      {canCancel && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelRegistration(reg)}
                          disabled={submittingId === reg.id}
                        >
                          Batalkan Pendaftaran
                        </Button>
                      )}

                      {canSubmit && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSubmitRegistration(reg)}
                          disabled={submittingId === reg.id}
                          className="font-bold"
                        >
                          {submittingId === reg.id
                            ? 'Mengirim...'
                            : isRevision
                            ? 'Ajukan Ulang Pendaftaran ➔'
                            : 'Submit Pendaftaran untuk Diverifikasi ➔'}
                        </Button>
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

export default RegistrationsPage;
