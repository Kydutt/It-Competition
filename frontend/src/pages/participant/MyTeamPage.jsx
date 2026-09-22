import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const MyTeamPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    competition_id: '',
    institution: '',
  });
  const [competitions, setCompetitions] = useState([]);
  const [msg, setMsg] = useState(null);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/participant/teams');
      if (res.data?.success) {
        setTeams(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    api.get('/competitions').then(res => {
      if (res.data?.success) setCompetitions(res.data.data);
    });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/participant/teams', formData);
      if (res.data?.success) {
        setMsg('Tim berhasil dibuat!');
        setShowCreate(false);
        fetchTeams();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal membuat tim');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Manajemen Tim</h2>
          <p className="text-sm text-gray-500">Kelola informasi tim dan daftar anggota kompetisi Anda</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Batal' : '+ Bentuk Tim Baru'}
        </Button>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Tim Baru</CardTitle>
            <CardDescription>Anda akan menjadi ketua tim secara otomatis</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nama Tim"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Garuda Tech"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cabang Lomba</label>
                <select
                  required
                  value={formData.competition_id}
                  onChange={e => setFormData({ ...formData, competition_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Pilih Kompetisi --</option>
                  {competitions.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                  ))}
                </select>
              </div>
              <Input
                label="Asal Instansi / Sekolah"
                required
                value={formData.institution}
                onChange={e => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Universitas / SMK / SMA"
              />
              <Button type="submit" variant="primary" className="font-bold">
                Simpan & Daftarkan Tim
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat data tim...</p>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-500">Anda belum membentuk tim kompetisi.</p>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              Bentuk Tim Sekarang
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map(team => (
            <Card key={team.id}>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <Badge variant="primary" className="mb-2">Kode: {team.code || 'TIM'}</Badge>
                  <CardTitle>{team.name}</CardTitle>
                </div>
                <Badge variant={team.status === 'ACTIVE' ? 'success' : 'default'}>{team.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-gray-600">Instansi: <strong>{team.institution}</strong></p>
                <p className="text-gray-600">Kompetisi: <strong>{team.competition?.name || '-'}</strong></p>
                <div className="pt-2 border-t border-gray-100">
                  <span className="font-semibold text-gray-700 block mb-1">Anggota Tim:</span>
                  <div className="space-y-1">
                    <p className="text-gray-500">• Ketua: {team.leader?.name} (Anda)</p>
                    {team.members?.map((m, idx) => (
                      <p key={idx} className="text-gray-500">• Anggota: {m.user?.name || m.name}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeamPage;
