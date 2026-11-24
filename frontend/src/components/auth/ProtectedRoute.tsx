import React from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '../ui/Button'
import { getDefaultDashboardForRole } from '../../utils/authRedirect'

interface ProtectedRouteProps {
  allowedRoles?: string[]
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles = ['participant'], children }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-[var(--color-brand-orange)] animate-spin" />
        <span className="text-sm font-medium text-slate-500">Memeriksa sesi login...</span>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const userDashboard = getDefaultDashboardForRole(user.role)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Akses Dibatasi</h2>
          <p className="text-sm text-slate-600">
            Halaman ini khusus diperuntukkan bagi akun dengan peran{' '}
            <span className="font-semibold text-slate-800">{allowedRoles.join(' / ')}</span>. Akun Anda terdaftar dengan peran{' '}
            <span className="font-semibold text-slate-800">{user.role}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(userDashboard, { replace: true })}
            >
              Kembali ke Dashboard Saya
            </Button>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Ganti Akun / Keluar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Akun Dinonaktifkan</h2>
          <p className="text-sm text-slate-600">
            Akun Anda saat ini tidak aktif. Silakan hubungi tim panitia pelaksana untuk informasi lebih lanjut.
          </p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Keluar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
