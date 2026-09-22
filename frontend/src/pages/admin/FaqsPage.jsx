import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export const AdminFaqsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [msg, setMsg] = useState(null);

  const fetchFaqs = async () => {
    try {
      const res = await api.get('/admin/faqs');
      if (res.data?.success) setFaqs(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/faqs', formData);
      if (res.data?.success) {
        setMsg('FAQ berhasil ditambahkan!');
        setShowForm(false);
        setFormData({ question: '', answer: '' });
        fetchFaqs();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal menambahkan FAQ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Kelola FAQ</h2>
          <p className="text-sm text-gray-500">Tanya jawab umum untuk peserta website</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Batal' : '+ Tambah FAQ'}
        </Button>
      </div>

      {msg && <Alert variant="info">{msg}</Alert>}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Tambah Pertanyaan Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Pertanyaan"
                required
                value={formData.question}
                onChange={e => setFormData({ ...formData, question: e.target.value })}
                placeholder="Misal: Apakah peserta wajib membawa laptop sendiri?"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jawaban</label>
                <textarea
                  rows={3}
                  required
                  value={formData.answer}
                  onChange={e => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Tuliskan jawaban yang jelas dan lengkap..."
                ></textarea>
              </div>
              <Button type="submit" variant="primary" className="font-bold">Simpan FAQ</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat FAQ...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map(f => (
            <Card key={f.id}>
              <CardHeader><CardTitle className="text-base">{f.question}</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 leading-relaxed">{f.answer}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFaqsPage;
