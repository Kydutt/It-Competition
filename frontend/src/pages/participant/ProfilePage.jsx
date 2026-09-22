import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const ProfilePage = () => {
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    institution: user?.institution || '',
    city: user?.city || '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.put('/participant/profile', formData);
      if (res.data?.success) {
        setSuccessMsg('Profil berhasil diperbarui');
        setUser(res.data.data);
        localStorage.setItem('auth_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Profil Pengguna</h2>
        <p className="text-sm text-gray-500">Kelola informasi kontak dan institusi asal Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
          <CardDescription>Email akun terhubung: <strong>{user?.email}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          {successMsg && <Alert variant="success" className="mb-4">{successMsg}</Alert>}
          {errorMsg && <Alert variant="danger" className="mb-4">{errorMsg}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
            />

            <Input
              label="Nomor WhatsApp"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08123456789"
            />

            <Input
              label="Instansi / Sekolah / Universitas"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="Contoh: Universitas Ciayumajakuning"
            />

            <Input
              label="Kota / Kabupaten Asal"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Cirebon / Indramayu / Majalengka / Kuningan"
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full font-bold">
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
