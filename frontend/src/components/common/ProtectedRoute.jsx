import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../ui/Button';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#100B08]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-[rgba(255,179,107,0.2)] border-t-[#FF6A00] rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-[#948277]">Memuat otentikasi akun...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const roleDashboard =
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'judge'
        ? '/judge/dashboard'
        : '/participant/dashboard';

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#100B08] p-6">
        <div className="max-w-md w-full bg-[#17110D] rounded-3xl p-8 border border-[rgba(255,179,107,0.2)] shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2A1D15] border border-[rgba(255,179,107,0.25)] text-[#FF6A00] mx-auto flex items-center justify-center shadow-orange-glow">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-[#FFF7F0]">
              Akses Dibatasi (403 Forbidden)
            </h2>
            <p className="text-xs text-[#948277] mt-1 leading-relaxed">
              Akun Anda dengan peran <span className="font-mono text-[#FFB36B] uppercase font-bold">[{role}]</span> tidak memiliki wewenang untuk membuka portal ini.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={roleDashboard}>
              <Button variant="primary" className="text-xs w-full flex items-center justify-center space-x-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Buka Dashboard Anda</span>
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="text-xs w-full flex items-center justify-center space-x-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Beranda Acara</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
