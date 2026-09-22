import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const AdminWinnersPage = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/winners')
      .then(res => {
        if (res.data?.success) setWinners(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Kelola Pemenang Kompetisi</h2>
        <p className="text-sm text-gray-500">Penetapan dan publikasi juara masing-masing cabang lomba</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat pemenang...</p>
        </div>
      ) : winners.length === 0 ? (
        <Card><div className="text-center py-12 text-gray-500">Belum ada pemenang yang diumumkan secara resmi.</div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {winners.map(w => (
            <Card key={w.id}>
              <CardHeader>
                <span className="text-xs font-bold text-brand-600">{w.award}</span>
                <CardTitle className="mt-1">{w.team?.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600">
                <p>Kompetisi: {w.competition?.name}</p>
                <p>Peringkat: #{w.rank}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWinnersPage;
