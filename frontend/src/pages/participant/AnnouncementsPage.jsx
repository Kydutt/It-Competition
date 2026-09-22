import React, { useState, useEffect } from 'react';
import competitionService from '../../services/competitionService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const ParticipantAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    competitionService.getAnnouncements().then(res => {
      if (res.success && res.data) setAnnouncements(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Pengumuman Khusus Peserta</h2>
        <p className="text-sm text-gray-500">Pemberitahuan resmi dan instruksi teknis kompetisi</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat pengumuman...</p>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Belum ada pengumuman terbaru untuk peserta saat ini.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <span className="text-xs text-brand-600 font-semibold">
                  {new Date(item.published_at || item.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </span>
                <CardTitle className="mt-1">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                {item.content}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantAnnouncementsPage;
