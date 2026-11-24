import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { resolveAuthRedirect } from '../../utils/authRedirect'

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    if (!email.trim() || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi Anda.')
      return
    }

    setIsLoading(true)
    try {
      const loggedInUser = await login({ email: email.trim(), password })
      const target = resolveAuthRedirect(loggedInUser.role, searchParams.get('redirect'))
      navigate(target, { replace: true })
    } catch (err: any) {
      console.error('Login error:', err)
      const msg =
        err.response?.data?.message ||
        'Email atau kata sandi tidak cocok. Silakan periksa kembali kredensial Anda.'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-[#FAF9F5] relative antialiased">
      {/* Top Left Navigation: Kembali ke Beranda */}
      <div className="w-full max-w-md sm:w-auto sm:max-w-none sm:absolute sm:top-6 sm:left-6 md:top-8 md:left-8 lg:top-10 lg:left-12 flex items-center mb-4 sm:mb-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#17243A] hover:text-[#E8AD22] transition-colors py-2 px-3 rounded-xl hover:bg-black/5 active:bg-black/10 min-h-[44px] cursor-pointer"
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft className="w-4 h-4 text-[#17243A] shrink-0" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group cursor-pointer"
            aria-label="Kembali ke Beranda IT COMP"
          >
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
              Masuk ke Portal Anda
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Akses akun untuk mengelola registrasi, tim, dan pengumpulan karya.
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
        <Card className="p-7 sm:p-9 space-y-6 bg-[#FFFEFA] rounded-3xl border border-[#E9E5DA] shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="contoh@domain.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E9E5DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-[#17243A] placeholder-[#64748B]/60 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#17243A] block">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E9E5DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-[#17243A] placeholder-[#64748B]/60 font-medium"
                />
              </div>
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
                Masuk Sekarang
              </Button>
            </div>
          </form>

          {/* Alternative action */}
          <div className="pt-4 border-t border-[#E9E5DA] text-center text-xs text-[#64748B]">
            Belum memiliki akun peserta?{' '}
            <Link
              to="/register"
              className="font-bold text-[#17243A] hover:text-[#E8AD22] transition-colors"
            >
              Daftar akun di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
