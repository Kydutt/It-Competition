import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Terminal, Sparkles } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const from = location.state?.from?.pathname;

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Format alamat email tidak valid.';
    }

    if (!password) {
      errs.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      errs.password = 'Kata sandi minimal 6 karakter.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const user = await login({ email, password });
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'judge') {
        navigate('/judge/dashboard', { replace: true });
      } else {
        navigate('/participant/dashboard', { replace: true });
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.message ||
        'Kredensial tidak valid. Silakan gunakan salah satu akun demo di bawah.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail, presetRole) => {
    setEmail(presetEmail);
    setPassword('password123');
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="min-h-screen bg-[#100B08] text-[#FFF7F0] flex flex-col justify-center relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,106,0,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,122,26,0.08)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />
      <div className="absolute inset-0 fest-grid-pattern opacity-30 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Branding & Futuristic Artwork (Desktop only) */}
          <div className="hidden lg:block lg:col-span-6 space-y-8 pr-6">
            <Link to="/" className="inline-flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white font-black text-2xl shadow-orange-glow group-hover:scale-105 transition-transform">
                N
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-[#FFF7F0] block leading-tight font-display">
                  NEXUS <span className="text-[#FF6A00]">ITC</span>
                </span>
                <span className="text-xs font-mono text-[#FFB36B] uppercase tracking-wider block">
                  EDITION 2026 // PORTAL
                </span>
              </div>
            </Link>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-[#FFF7F0] leading-tight">
                Empowering Minds, <br />
                <span className="text-gradient-orange">
                  Securing Innovations.
                </span>
              </h1>
              <p className="text-base text-[#C4B3A7] leading-relaxed font-sans max-w-lg">
                Masuk ke platform terintegrasi festival teknologi untuk memantau pendaftaran tim, pengumpulan karya ilmiah, atau evaluasi dewan juri.
              </p>
            </div>

            {/* Interactive Telemetry Box */}
            <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono text-[#FFB36B]">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>SYSTEM_ENV: PROTOTYPE_SIMULATION</span>
                </span>
                <span className="text-emerald-400">READY</span>
              </div>

              <div className="space-y-2 text-xs text-[#948277] font-mono">
                <p>• Akses multi-peran: Admin, Dewan Juri, & Peserta Kompetisi</p>
                <p>• Tidak memerlukan server backend; data tersimpan di storage lokal</p>
                <p>• Validasi dan kalkulasi skor otomatis</p>
              </div>
            </div>
          </div>

          {/* Right Column: Polished Login Form */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            {/* Mobile Brand Header */}
            <div className="lg:hidden text-center mb-8 space-y-2">
              <Link to="/" className="inline-flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white font-bold text-xl shadow-orange-glow">
                  N
                </div>
                <span className="text-xl font-bold font-display text-[#FFF7F0]">
                  NEXUS <span className="text-[#FF6A00]">ITC</span>
                </span>
              </Link>
            </div>

            <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.22)] rounded-3xl p-7 sm:p-10 shadow-2xl space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black font-display text-[#FFF7F0] tracking-tight">
                  Welcome Back.
                </h2>
                <p className="text-xs sm:text-sm text-[#C4B3A7]">
                  Continue your journey into technology and innovation.
                </p>
              </div>

              {serverError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs leading-relaxed">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase block">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      placeholder="nama@email.com"
                      className={`w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-[#211811] border ${
                        errors.email ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                      } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-rose-400 font-sans">{errors.email}</p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase">
                      Kata Sandi
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#FFB36B] hover:underline"
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: null });
                      }}
                      placeholder="••••••••"
                      className={`w-full text-sm pl-10 pr-10 py-2.5 rounded-xl bg-[#211811] border ${
                        errors.password ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                      } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#948277] hover:text-[#FFF7F0] focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-400 font-sans">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-[#C4B3A7] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[rgba(255,179,107,0.2)] bg-[#211811] text-[#FF6A00] focus:ring-[#FFC58A]"
                    />
                    <span>Ingat saya di perangkat ini</span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="glow"
                  loading={loading}
                  className="w-full py-3 text-sm font-bold gap-2"
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Demo Roles Preset Switcher */}
              <div className="pt-4 border-t border-[rgba(255,179,107,0.12)] space-y-2.5">
                <p className="text-[10px] font-mono text-[#948277] uppercase tracking-wider text-center">
                  Gunakan Akun Pengujian Demo:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="btn-demo-participant"
                    type="button"
                    onClick={() => setPreset('participant@example.com', 'participant')}
                    className="p-2 rounded-xl bg-[#211811] hover:bg-[#FF6A00]/20 text-[#FFB36B] border border-[rgba(255,179,107,0.2)] text-xs font-semibold text-center transition-colors"
                  >
                    Peserta
                  </button>
                  <button
                    id="btn-demo-judge"
                    type="button"
                    onClick={() => setPreset('judge@example.com', 'judge')}
                    className="p-2 rounded-xl bg-[#211811] hover:bg-[#FF7A1A]/20 text-[#FFB36B] border border-[rgba(255,179,107,0.2)] text-xs font-semibold text-center transition-colors"
                  >
                    Juri
                  </button>
                  <button
                    id="btn-demo-admin"
                    type="button"
                    onClick={() => setPreset('admin@example.com', 'admin')}
                    className="p-2 rounded-xl bg-[#211811] hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold text-center transition-colors"
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Link to Registration */}
              <div className="text-center pt-2">
                <p className="text-xs text-[#948277]">
                  Belum memiliki akun peserta?{' '}
                  <Link to="/register" className="text-[#FF6A00] hover:underline font-semibold">
                    Daftar di sini
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
