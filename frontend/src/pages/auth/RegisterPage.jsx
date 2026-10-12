import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, School, Hash, Lock, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCompetition = searchParams.get('competition');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    institution: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nama lengkap wajib diisi.';
    
    if (!formData.email.trim()) {
      errs.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Format alamat email tidak valid.';
    }

    if (!formData.studentId.trim()) {
      errs.studentId = 'Nomor Identitas Mahasiswa / Pelajar (NIM/NISN) wajib diisi.';
    }

    if (!formData.institution.trim()) {
      errs.institution = 'Asal perguruan tinggi atau sekolah wajib diisi.';
    }

    if (!formData.password) {
      errs.password = 'Kata sandi wajib diisi.';
    } else if (formData.password.length < 6) {
      errs.password = 'Kata sandi minimal 6 karakter.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
    }

    if (!formData.termsAccepted) {
      errs.termsAccepted = 'Anda harus menyetujui syarat & ketentuan perlombaan.';
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
      await register({
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        institution: formData.institution,
        password: formData.password,
      });

      // Redirect directly to participant dashboard
      navigate('/participant/dashboard', { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.message ||
        'Pendaftaran gagal. Silakan periksa kembali data Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#100B08] text-[#FFF7F0] flex flex-col justify-center relative overflow-hidden py-12">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,106,0,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />
      <div className="absolute inset-0 fest-grid-pattern opacity-30 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Branding Artwork (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 space-y-6 pr-4">
            <Link to="/" className="inline-flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white font-black text-2xl shadow-orange-glow group-hover:scale-105 transition-transform">
                N
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-[#FFF7F0] block leading-tight font-display">
                  NEXUS <span className="text-[#FF6A00]">ITC</span>
                </span>
                <span className="text-xs font-mono text-[#FFB36B] uppercase tracking-wider block">
                  EDITION 2026 // REGISTRATION
                </span>
              </div>
            </Link>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#FFF7F0] leading-tight">
                Mulai Perjalanan <br />
                <span className="text-gradient-orange">
                  Kompetisi Digital Anda.
                </span>
              </h1>
              <p className="text-sm text-[#C4B3A7] leading-relaxed font-sans">
                Buat akun peserta resmi untuk mendaftarkan tim, memilih cabang lomba, mengunggah karya, dan memantau status evaluasi secara real-time.
              </p>
            </div>

            {preselectedCompetition && (
              <div className="p-4 rounded-2xl bg-[#1C1410] border border-[#FF7A1A]/40 space-y-1">
                <span className="text-[11px] font-mono text-[#FFB36B] uppercase block">
                  Cabang Lomba Terpilih:
                </span>
                <p className="text-sm font-bold text-[#FFF7F0]">
                  {preselectedCompetition}
                </p>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-[#1C1410] border border-[rgba(255,179,107,0.18)] text-xs text-[#948277] font-mono space-y-2">
              <p className="text-[#FFB36B] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                <span>PANDUAN KEPESERTAAN</span>
              </p>
              <p>• Pendaftaran akun publik otomatis berstatus peran Peserta (Participant).</p>
              <p>• Data akun tersimpan aman pada sesi browser prototipe.</p>
              <p>• Anggota tim dapat ditambahkan setelah akun ketua tim aktif.</p>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-7 max-w-xl w-full mx-auto">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6 space-y-1">
              <Link to="/" className="inline-flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white font-bold text-lg shadow-orange-glow">
                  N
                </div>
                <span className="text-lg font-bold font-display text-[#FFF7F0]">
                  NEXUS <span className="text-[#FF6A00]">ITC</span>
                </span>
              </Link>
            </div>

            <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.22)] rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black font-display text-[#FFF7F0] tracking-tight">
                  Pendaftaran Peserta
                </h2>
                <p className="text-xs sm:text-sm text-[#C4B3A7]">
                  Lengkapi data diri ketua tim untuk membuat akun kompetisi.
                </p>
              </div>

              {serverError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase block">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Contoh: Budi Santoso"
                      className={`w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-[#211811] border ${
                        errors.name ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                      } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                    />
                  </div>
                  {errors.name && <p className="text-[11px] text-rose-400 font-sans">{errors.name}</p>}
                </div>

                {/* Email address */}
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase block">
                    Alamat Email Aktif
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="nama@email.com"
                      className={`w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-[#211811] border ${
                        errors.email ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                      } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-rose-400 font-sans">{errors.email}</p>}
                </div>

                {/* Two-Column: Student ID & Institution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase block">
                      NIM / NISN Identitas
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        placeholder="Contoh: 2301010045"
                        className={`w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-[#211811] border ${
                          errors.studentId ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                        } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                      />
                    </div>
                    {errors.studentId && <p className="text-[11px] text-rose-400 font-sans">{errors.studentId}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase block">
                      Sekolah / Universitas
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution}
                        onChange={handleChange}
                        placeholder="Contoh: Universitas Gunung Jati"
                        className={`w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-[#211811] border ${
                          errors.institution ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                        } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                      />
                    </div>
                    {errors.institution && <p className="text-[11px] text-rose-400 font-sans">{errors.institution}</p>}
                  </div>
                </div>

                {/* Two-Column: Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase block">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 karakter"
                        className={`w-full text-sm pl-10 pr-9 py-2.5 rounded-xl bg-[#211811] border ${
                          errors.password ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                        } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#948277] hover:text-[#FFF7F0]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[11px] text-rose-400 font-sans">{errors.password}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-[#C4B3A7] uppercase block">
                      Ulangi Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Ulangi sandi"
                        className={`w-full text-sm pl-10 pr-9 py-2.5 rounded-xl bg-[#211811] border ${
                          errors.confirmPassword ? 'border-rose-500' : 'border-[rgba(255,179,107,0.2)]'
                        } text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#948277] hover:text-[#FFF7F0]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-rose-400 font-sans">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="pt-1 space-y-1">
                  <label className="flex items-start gap-2.5 text-xs text-[#C4B3A7] cursor-pointer">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="mt-0.5 rounded border-[rgba(255,179,107,0.2)] bg-[#211811] text-[#FF6A00] focus:ring-[#FFC58A]"
                    />
                    <span>
                      Saya menyetujui seluruh ketentuan lomba, tata tertib kompetisi, dan keaslian karya yang diajukan pada HIMATIF ITC 2026.
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-[11px] text-rose-400 font-sans">{errors.termsAccepted}</p>
                  )}
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="glow"
                  loading={loading}
                  className="w-full py-3 text-sm font-bold gap-2 mt-2"
                >
                  <span>Daftar & Buka Dashboard Peserta</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Link back to Login */}
              <div className="text-center pt-2">
                <p className="text-xs text-[#948277]">
                  Sudah memiliki akun?{' '}
                  <Link to="/login" className="text-[#FF6A00] hover:underline font-semibold">
                    Masuk ke sini
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

export default RegisterPage;
