import React, { useState, useEffect } from 'react';
import submissionService from '../../services/submissionService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export const AdminSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionService.getAdminSubmissions().then(res => {
      if (res.success && res.data) setSubmissions(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Karya Masuk (Submissions)</h2>
        <p className="text-sm text-gray-500">Seluruh karya yang dikumpulkan oleh peserta lomba</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat karya masuk...</p>
        </div>
      ) : submissions.length === 0 ? (
        <Card><div className="text-center py-12 text-gray-500">Belum ada karya yang diunggah peserta.</div></Card>
      ) : (
        <div className="space-y-4">
          {submissions.map(s => (
            <Card key={s.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="primary" className="mb-1">{s.competition?.name}</Badge>
                  <CardTitle>{s.title}</CardTitle>
                </div>
                <Badge variant={s.status === 'ACCEPTED' ? 'success' : 'info'}>{s.status}</Badge>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-2">
                <p>Tim: <strong>{s.team?.name}</strong></p>
                <p>{s.description}</p>
                <div className="pt-2 flex gap-3">
                  {s.file_url && <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-bold underline">Berkas</a>}
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

export default AdminSubmissionsPage;
