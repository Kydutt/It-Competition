import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const AdminSponsorsPage = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', website: '', category: 'Platinum' });
  const [msg, setMsg] = useState(null);

  const fetchSponsors = async () => {
    try {
      const res = await api.get('/admin/sponsors');
      if (res.data?.success) setSponsors(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/sponsors', formData);
      if (res.data?.success) {
        setMsg('Sponsor berhasil ditambahkan!');
        setShowForm(false);
        setFormData({ name: '', website: '', category: 'Platinum' });
        fetchSponsors();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal menambahkan sponsor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Kelola Sponsor & Mitra</h2>
          <p className="text-sm text-gray-500">Daftar instansi pendukung kompetisi</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Batal' : '+ Tambah Sponsor'}
        </Button>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Tambah Mitra Sponsor</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nama Mitra / Sponsor"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: PT Teknologi Nusantara"
              />
              <Input
                label="Tautan Website"
                type="url"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://perusahaan.com"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori Sponsor</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Platinum">Platinum</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Media Partner">Media Partner</option>
                </select>
              </div>
              <Button type="submit" variant="primary" className="font-bold">Simpan Mitra</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat sponsor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sponsors.map(s => (
            <Card key={s.id}>
              <CardHeader>
                <span className="text-xs font-bold text-brand-600 block">{s.category}</span>
                <CardTitle className="text-base mt-1">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-500">
                {s.website ? <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{s.website}</a> : 'Tidak ada tautan'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSponsorsPage;
