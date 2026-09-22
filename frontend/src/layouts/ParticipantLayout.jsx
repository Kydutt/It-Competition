import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import ErrorBoundary from '../components/common/ErrorBoundary';
import useAuth from '../hooks/useAuth';

export const ParticipantLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar role="participant" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 z-10">
          <div>
            <h1 className="text-base font-bold text-gray-900">Portal Peserta HIMATIF ITC</h1>
            <p className="text-xs text-gray-500">Kelola pendaftaran lomba, tim, karya, dan riwayat pembayaran</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/competitions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100"
            >
              + Daftar Lomba Baru
            </Link>
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.name ? user.name.charAt(0) : 'P'}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantLayout;
