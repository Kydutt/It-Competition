import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCompetition = searchParams.get('competition');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    institution: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.password_confirmation) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join(', ')) ||
        err.message ||
        'Registrasi gagal. Periksa kembali form isian Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-950">
            HIMATIF <span className="text-brand-600">ITC</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">
          Pendaftaran Akun Ketua Tim
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500">
            Masuk di sini
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          {preselectedCompetition && (
            <Alert variant="info">
              Mendaftar untuk cabang: <strong>{preselectedCompetition}</strong>
            </Alert>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap Ketua Tim"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Budi Santoso"
            />

            <Input
              label="Alamat Email Aktif"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="ketua@email.com"
            />

            <Input
              label="Nomor WhatsApp"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="08123456789"
            />

            <Input
              label="Asal Sekolah / Universitas"
              name="institution"
              required
              value={formData.institution}
              onChange={handleChange}
              placeholder="Contoh: Universitas Ciayumajakuning"
            />

            <Input
              label="Kata Sandi (Password)"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
            />

            <Input
              label="Konfirmasi Kata Sandi"
              name="password_confirmation"
              type="password"
              required
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Ulangi kata sandi"
            />

            <p className="text-xs text-gray-500 leading-relaxed">
              Dengan mendaftar, Anda menyetujui seluruh ketentuan lomba dan peraturan yang berlaku di HIMATIF IT Competition 2026.
            </p>

            <Button type="submit" variant="primary" loading={loading} className="w-full font-bold py-2.5">
              Buat Akun & Masuk Dashboard
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
