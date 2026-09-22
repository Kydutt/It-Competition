import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const JudgeSubmissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    submissionService.getJudgeSubmissionDetail(id).then(res => {
      if (res.success && res.data) {
        setSubmission(res.data);
      }
      setLoading(false);
    });
  }, [id]);

  const handleScoreChange = (criterionId, val) => {
    setScores(prev => ({ ...prev, [criterionId]: Number(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Loop over criteria and post scores
      const criteriaList = submission?.competition?.judging_criteria || [];
      for (const crit of criteriaList) {
        const scoreVal = scores[crit.id] || 0;
        await submissionService.submitScore({
          submission_id: Number(id),
          criterion_id: crit.id,
          score: scoreVal,
          notes: notes,
        });
      }
      setMsg('Nilai juri berhasil disimpan!');
      setTimeout(() => navigate('/judge/scores'), 1200);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal menyimpan nilai');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Memuat rincian karya...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Karya tidak ditemukan.</p>
        <Link to="/judge/submissions"><Button className="mt-4" variant="primary">Kembali ke Daftar Karya</Button></Link>
      </div>
    );
  }

  const criteria = submission.competition?.judging_criteria || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link to="/judge/submissions" className="text-xs font-semibold text-brand-600 hover:underline">
          &larr; Kembali ke Daftar Karya
        </Link>
        <h2 className="text-2xl font-black text-gray-950 mt-2">{submission.title}</h2>
        <p className="text-sm text-gray-500">Tim: <strong>{submission.team?.name}</strong> • {submission.competition?.name}</p>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {/* Submission Assets */}
      <Card>
        <CardHeader><CardTitle>Deskripsi & Berkas Karya</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700">
          <p className="whitespace-pre-line leading-relaxed">{submission.description}</p>
          <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs font-semibold">
            {submission.file_url && (
              <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                📄 Unduh Berkas / Dokumen
              </a>
            )}
            {submission.demo_url && (
              <a href={submission.demo_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 border border-amber-200">
                🔗 Akses Demo Aplikasi / Desain
              </a>
            )}
            {submission.repository_url && (
              <a href={submission.repository_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                💻 Repositori GitHub
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lembar Penilaian Juri</CardTitle>
          <CardDescription>Berikan skor objektif antara 0 - 100 untuk setiap kriteria berikut</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {criteria.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada rubrik kriteria untuk cabang lomba ini.</p>
            ) : (
              <div className="space-y-4">
                {criteria.map(crit => (
                  <div key={crit.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 text-sm">{crit.name}</p>
                      <p className="text-xs text-gray-500">Bobot: {crit.weight}%</p>
                    </div>
                    <div className="w-full sm:w-36">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={scores[crit.id] ?? ''}
                        onChange={e => handleScoreChange(crit.id, e.target.value)}
                        placeholder="Skor 0-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Evaluasi & Umpan Balik</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Tuliskan catatan kelebihan, kekurangan, dan masukan untuk peserta..."
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500"
              ></textarea>
            </div>

            <Button type="submit" variant="primary" loading={submitting} className="w-full font-bold">
              Simpan & Finalisasi Penilaian
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JudgeSubmissionDetailPage;
