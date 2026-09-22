import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login({ email, password });
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'judge') {
        navigate('/judge', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail) => {
    setEmail(presetEmail);
    setPassword('password123');
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
          Masuk ke Akun Anda
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Belum memiliki akun?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500">
            Daftar ketua tim di sini
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          {error && <Alert variant="danger">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />

            <Input
              label="Kata Sandi"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-gray-600">
                <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 mr-2" />
                Ingat saya
              </label>
              <Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">
                Lupa kata sandi?
              </Link>
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full font-bold py-2.5">
              Masuk Sekarang
            </Button>
          </form>

          {/* Quick Development Credentials Preset */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">
              Akun Testing Development
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreset('participant@example.com')}
                className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-brand-700 font-semibold border border-orange-200 transition-colors text-center"
              >
                Peserta
              </button>
              <button
                type="button"
                onClick={() => setPreset('judge@example.com')}
                className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold border border-amber-200 transition-colors text-center"
              >
                Juri
              </button>
              <button
                type="button"
                onClick={() => setPreset('admin@example.com')}
                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 transition-colors text-center"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
