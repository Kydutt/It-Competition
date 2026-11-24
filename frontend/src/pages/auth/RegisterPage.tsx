import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { resolveAuthRedirect } from '../../utils/authRedirect'

export const RegisterPage: React.FC = () => {
  const { user, isAuthenticated, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = resolveAuthRedirect(user.role, searchParams.get('redirect'))
      navigate(target, { replace: true })
    }
  }, [isAuthenticated, user, searchParams, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (password !== passwordConfirmation) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi yang dimasukkan.')
      return
    }

    if (!termsAccepted) {
      setErrorMessage('Anda wajib menyetujui Syarat & Ketentuan partisipasi sebelum mendaftar.')
      return
    }

    setIsLoading(true)
    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        terms_accepted: termsAccepted,
      })
      const target = resolveAuthRedirect(newUser.role, searchParams.get('redirect'))
      navigate(target, { replace: true })
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.response?.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0]
        setErrorMessage(err.response.data.errors[firstErrorKey][0])
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Gagal melakukan pendaftaran akun. Silakan coba kembali.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 bg-[#FAF9F5]">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-[#17243A] flex items-center justify-center text-[#F5C842] shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-black text-2xl tracking-tighter">IT</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-2xl tracking-tight text-[#17243A] leading-tight">
                IT<span className="text-[#E8AD22]">COMP</span>
              </span>
              <span className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase">
                Festival 2026
              </span>
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#17243A] tracking-tight">
              Registrasi Akun Peserta
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Buat akun baru untuk mulai mendaftar kompetisi dan mengunggah karya.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed shadow-2xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="p-7 sm:p-9 space-y-5 bg-[#FFFEFA] rounded-3xl border border-[#E9E5DA] shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17243A] block">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama sesuai kartu identitas"
                  required
                  autoComplete="name"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E9E5DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-[#17243A] placeholder-[#64748B]/60 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17243A] block">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email.aktif@domain.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E9E5DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-[#17243A] placeholder-[#64748B]/60 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17243A] block">
                Kata Sandi <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E9E5DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-[#17243A] placeholder-[#64748B]/60 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17243A] block">
                Konfirmasi Kata Sandi <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E9E5DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-[#17243A] placeholder-[#64748B]/60 font-medium"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-[#E9E5DA] text-[#E8AD22] focus:ring-[#F5C842] mt-0.5 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-[#64748B] leading-relaxed cursor-pointer select-none">
                Saya menyetujui{' '}
                <Link to="/terms" target="_blank" className="font-bold text-[#17243A] hover:underline">
                  Syarat &amp; Ketentuan
                </Link>{' '}
                serta{' '}
                <Link to="/privacy" target="_blank" className="font-bold text-[#17243A] hover:underline">
                  Kebijakan Privasi
                </Link>{' '}
                IT COMP 2026.
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full justify-center font-bold shadow-md hover:shadow-lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Daftar Akun Sekarang
              </Button>
            </div>
          </form>

          {/* Alternative action */}
          <div className="pt-4 border-t border-[#E9E5DA] text-center text-xs text-[#64748B]">
            Sudah memiliki akun?{' '}
            <Link
              to="/login"
              className="font-bold text-[#17243A] hover:text-[#E8AD22] transition-colors"
            >
              Masuk di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
