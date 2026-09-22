import React, { useState, useEffect } from 'react';
import submissionService from '../../services/submissionService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const JudgeScoresPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionService
      .getJudgeSubmissions()
      .then((res) => {
        if (res?.success) {
          const raw = res.data;
          const items = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setSubmissions(items);
        }
      })
      .catch((err) => {
        console.error(err);
        setSubmissions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const submissionList = Array.isArray(submissions) ? submissions : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Rekap Nilai Juri</h2>
        <p className="text-sm text-gray-500">Tinjauan nilai yang telah Anda berikan kepada tim peserta</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat rekap nilai...</p>
        </div>
      ) : submissionList.length === 0 ? (
        <Card><div className="text-center py-12 text-gray-500">Belum ada rekap penilaian.</div></Card>
      ) : (
        <div className="space-y-4">
          {submissionList.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase block">{s.competition?.name}</span>
                  <CardTitle className="mt-0.5">{s.title}</CardTitle>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 rounded-full text-gray-700">
                  Tim: {s.team?.name}
                </span>
              </CardHeader>
              <CardContent className="text-xs text-gray-600">
                <p>Status: <strong>{s.status}</strong></p>
                <p>Tanggal Pengumpulan: {new Date(s.created_at).toLocaleDateString('id-ID')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JudgeScoresPage;
