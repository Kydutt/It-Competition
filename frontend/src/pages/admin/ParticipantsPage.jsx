import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export const AdminParticipantsPage = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/participants')
      .then(res => {
        if (res.data?.success) setParticipants(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Daftar Peserta</h2>
        <p className="text-sm text-gray-500">Kelola akun ketua tim dan peserta terdaftar</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat data peserta...</p>
        </div>
      ) : participants.length === 0 ? (
        <Card><div className="text-center py-12 text-gray-500">Belum ada peserta terdaftar.</div></Card>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Institusi</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Peran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.email}</td>
                    <td className="p-4 text-gray-600">{p.institution || '-'}</td>
                    <td className="p-4 text-gray-600">{p.phone || '-'}</td>
                    <td className="p-4"><Badge variant="primary">{p.role}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParticipantsPage;
