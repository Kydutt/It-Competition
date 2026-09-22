import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const AdminAnnouncementsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [msg, setMsg] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await api.get('/admin/announcements');
      if (res.data?.success) setItems(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/announcements', formData);
      if (res.data?.success) {
        setMsg('Pengumuman berhasil dipublikasikan!');
        setShowForm(false);
        setFormData({ title: '', content: '' });
        fetchItems();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal mempublikasikan pengumuman');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Kelola Pengumuman</h2>
          <p className="text-sm text-gray-500">Buat dan publikasikan siaran pers atau pengumuman resmi</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Batal' : '+ Buat Pengumuman'}
        </Button>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Form Pengumuman Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Judul Pengumuman"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Perpanjangan Batas Pendaftaran Lomba"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Isi Pengumuman</label>
                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Tulis detail informasi pengumuman..."
                ></textarea>
              </div>
              <Button type="submit" variant="primary" className="font-bold">Publikasikan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat pengumuman...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(i => (
            <Card key={i.id}>
              <CardHeader>
                <span className="text-xs text-brand-600 font-semibold">{new Date(i.created_at).toLocaleDateString('id-ID')}</span>
                <CardTitle className="mt-1">{i.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {i.content}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementsPage;
