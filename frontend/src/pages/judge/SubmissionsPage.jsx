import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const JudgeSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionService.getJudgeSubmissions().then(res => {
      if (res.success && res.data) setSubmissions(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Daftar Karya Peserta</h2>
        <p className="text-sm text-gray-500">Pilih karya tim untuk melakukan penilaian sesuai kriteria</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat karya...</p>
        </div>
      ) : submissions.length === 0 ? (
        <Card><div className="text-center py-12 text-gray-500">Belum ada karya yang siap dinilai.</div></Card>
      ) : (
        <div className="space-y-4">
          {submissions.map(s => (
            <Card key={s.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="primary" className="mb-1">{s.competition?.name}</Badge>
                  <CardTitle>{s.title}</CardTitle>
                </div>
                <Link to={`/judge/submissions/${s.id}`}>
                  <Button variant="primary" size="sm" className="font-bold">
                    Beri Nilai &rarr;
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-2">
                <p>Tim: <strong>{s.team?.name}</strong> • Instansi: {s.team?.institution}</p>
                <p className="line-clamp-2">{s.description}</p>
                <div className="pt-2 flex gap-3">
                  {s.file_url && <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-bold underline">Berkas Dokumen</a>}
                  {s.demo_url && <a href={s.demo_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-bold underline">Demo Link</a>}
                  {s.repository_url && <a href={s.repository_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-bold underline">GitHub</a>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JudgeSubmissionsPage;
