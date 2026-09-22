import React, { useState, useEffect } from 'react';
import submissionService from '../../services/submissionService';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    competition_id: '',
    team_id: '',
    title: '',
    description: '',
    demo_url: '',
    repository_url: '',
    file_url: '',
  });
  const [msg, setMsg] = useState(null);

  const fetchSubmissions = async () => {
    try {
      const res = await submissionService.getParticipantSubmissions();
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    api.get('/participant/teams').then(res => {
      if (res.data?.success) setTeams(res.data.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await submissionService.createSubmission(formData);
      if (res.success) {
        setMsg('Karya berhasil diunggah!');
        setShowForm(false);
        fetchSubmissions();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal mengunggah karya');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Pengumpulan Karya (Submissions)</h2>
          <p className="text-sm text-gray-500">Kirimkan berkas karya akhir, dokumen proposal, atau link demo sebelum batas waktu</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Batal' : '+ Kumpulkan Karya Baru'}
        </Button>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Unggah Karya</CardTitle>
            <CardDescription>Pastikan seluruh link repositori atau Google Drive dapat diakses publik/juri</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Tim Anda</label>
                <select
                  required
                  value={formData.team_id}
                  onChange={e => {
                    const t = teams.find(item => String(item.id) === e.target.value);
                    setFormData({
                      ...formData,
                      team_id: e.target.value,
                      competition_id: t?.competition_id || '',
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Pilih Tim --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.competition?.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Judul Karya / Proyek"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Aplikasi Smart Waste Management Ciayumajakuning"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Singkat Karya</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Jelaskan masalah yang diselesaikan dan teknologi yang digunakan..."
                ></textarea>
              </div>

              <Input
                label="Tautan Berkas Karya / Google Drive (File URL)"
                type="url"
                value={formData.file_url}
                onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://drive.google.com/..."
              />

              <Input
                label="Tautan Demo Aplikasi / Figma (Demo URL)"
                type="url"
                value={formData.demo_url}
                onChange={e => setFormData({ ...formData, demo_url: e.target.value })}
                placeholder="https://figma.com/... atau https://my-app.vercel.app"
              />

              <Input
                label="Tautan Repositori GitHub (Opsional)"
                type="url"
                value={formData.repository_url}
                onChange={e => setFormData({ ...formData, repository_url: e.target.value })}
                placeholder="https://github.com/username/repository"
              />

              <Button type="submit" variant="primary" className="font-bold">
                Kirim Karya Akhir
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat riwayat pengumpulan karya...</p>
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Belum ada karya yang diunggah.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <Card key={sub.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="primary" className="mb-2">Tim: {sub.team?.name}</Badge>
                  <CardTitle>{sub.title}</CardTitle>
                </div>
                <Badge variant={sub.status === 'ACCEPTED' ? 'success' : 'info'}>{sub.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-gray-600">
                <p>{sub.description}</p>
                <div className="pt-2 flex flex-wrap gap-3">
                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-semibold">
                      📄 Berkas Karya
                    </a>
                  )}
                  {sub.demo_url && (
                    <a href={sub.demo_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-semibold">
                      🔗 Demo / Figma
                    </a>
                  )}
                  {sub.repository_url && (
                    <a href={sub.repository_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-semibold">
                      💻 Repositori GitHub
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;
