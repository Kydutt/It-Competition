import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import registrationService from '../../services/registrationService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const MyCompetitionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [competitions, setCompetitions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [compRes, regRes, teamRes] = await Promise.all([
        api.get('/competitions'),
        registrationService.getRegistrations(),
        registrationService.getTeams(),
      ]);

      if (compRes.data?.success) setCompetitions(compRes.data.data || []);
      if (regRes?.data) setRegistrations(regRes.data || []);
      if (teamRes?.data) setTeams(teamRes.data || []);
    } catch (err) {
      console.error('Failed to load competition data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterIndividual = async (competitionId) => {
    try {
      setActionLoading(competitionId);
      setAlertInfo(null);
      const res = await registrationService.createRegistration({
        competition_id: competitionId,
      });

      if (res?.success) {
        setAlertInfo({
          type: 'success',
          message: 'Pendaftaran individu berhasil dibuat sebagai Draf! Silakan periksa status pendaftaran Anda.',
        });
        await loadData();
        navigate('/registrations');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.competition_id?.[0] || 'Gagal mendaftar kompetisi.';
      setAlertInfo({ type: 'danger', message: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const getTargetLevelLabel = (level) => {
    return level === 'university' ? 'Mahasiswa (D3/D4/S1)' : 'Siswa SMA/SMK/Sederajat';
  };

  const isEligible = (compLevel) => {
    if (!user?.education_level) return true;
    return user.education_level === compLevel;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Eksplorasi & Pendaftaran Lomba</h2>
          <p className="text-sm text-gray-500">Pilih cabang kompetisi sesuai jenjang pendidikan Anda ({user?.education_level === 'high_school' ? 'SMA/SMK' : 'Mahasiswa'})</p>
        </div>
        <div className="flex gap-2">
          <Link to="/my-team">
            <Button variant="secondary" size="sm">
              Kelola Tim Saya
            </Button>
          </Link>
          <Link to="/registrations">
            <Button variant="primary" size="sm">
              Lihat Status Pendaftaran
            </Button>
          </Link>
        </div>
      </div>

      {alertInfo && (
        <Alert variant={alertInfo.type} onClose={() => setAlertInfo(null)}>
          {alertInfo.message}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat katalog cabang kompetisi...</p>
        </div>
      ) : competitions.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Belum ada cabang lomba yang dibuka saat ini.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitions.map((comp) => {
            const eligible = isEligible(comp.target_level);
            const userReg = registrations.find(
              (r) => r.competition_id === comp.id && r.status !== 'cancelled'
            );
            const userTeam = teams.find((t) => t.competition_id === comp.id);
            const isTeam = comp.competition_type === 'team';

            return (
              <Card key={comp.id} className="flex flex-col justify-between hover:border-brand-300 transition-all shadow-sm">
                <div>
                  <CardHeader className="flex flex-col gap-2 pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        <Badge variant="primary">{comp.category_label || comp.category?.toUpperCase() || 'LOMBA'}</Badge>
                        <Badge variant={isTeam ? 'info' : 'default'}>
                          {isTeam ? `Tim (${comp.min_team_member}-${comp.max_team_member} org)` : 'Individu'}
                        </Badge>
                      </div>

                      {userReg ? (
                        <Badge variant={userReg.status === 'approved' ? 'success' : userReg.status === 'revision_required' ? 'warning' : 'primary'}>
                          {userReg.status_label || userReg.status}
                        </Badge>
                      ) : eligible ? (
                        <Badge variant="success">Eligible</Badge>
                      ) : (
                        <Badge variant="danger">Jenjang Tidak Sesuai</Badge>
                      )}
                    </div>

                    <CardTitle className="text-xl font-bold text-gray-900 mt-1">{comp.title || comp.name}</CardTitle>
                    <p className="text-xs text-brand-700 font-medium">{getTargetLevelLabel(comp.target_level)}</p>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs text-gray-600">
                    <p className="line-clamp-2 text-gray-600 leading-relaxed">{comp.description}</p>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Biaya Pendaftaran:</span>
                        <span className="font-bold text-gray-900">
                          {comp.registration_fee > 0 ? `Rp ${Number(comp.registration_fee).toLocaleString('id-ID')}` : 'Gratis'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Batas Pendaftaran:</span>
                        <span className="font-semibold text-gray-800">
                          {comp.registration_end ? new Date(comp.registration_end).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Segera Ditutup'}
                        </span>
                      </div>
                    </div>

                    {userTeam && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-950">Tim Anda: {userTeam.name}</span>
                          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {userTeam.code}
                          </span>
                        </div>
                        <p className="text-blue-800 text-[11px]">
                          Ketua: {userTeam.leader?.name} • {userTeam.members?.length || userTeam.members_count || 1} Anggota
                        </p>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-gray-100 mt-3 flex items-center justify-end gap-2">
                  <Link to={`/competitions/${comp.slug}`}>
                    <Button variant="secondary" size="sm">
                      Detail Info
                    </Button>
                  </Link>

                  {userReg ? (
                    <Link to="/registrations">
                      <Button variant="primary" size="sm">
                        Lihat Pendaftaran
                      </Button>
                    </Link>
                  ) : !eligible ? (
                    <Button variant="secondary" size="sm" disabled>
                      Tidak Memenuhi Syarat
                    </Button>
                  ) : isTeam ? (
                    userTeam ? (
                      userTeam.leader_id === user?.id ? (
                        <Link to={`/registrations`}>
                          <Button variant="primary" size="sm">
                            Daftarkan Tim
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/my-team">
                          <Button variant="secondary" size="sm">
                            Lihat Tim
                          </Button>
                        </Link>
                      )
                    ) : (
                      <Link to={`/my-team?competition_id=${comp.id}`}>
                        <Button variant="primary" size="sm">
                          Bentuk / Gabung Tim
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRegisterIndividual(comp.id)}
                      disabled={actionLoading === comp.id}
                    >
                      {actionLoading === comp.id ? 'Memproses...' : 'Daftar Sekarang'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCompetitionsPage;
