import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import useAuth from '../hooks/useAuth';
import Badge from '../components/ui/Badge';

export const JudgeLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar role="judge" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base font-bold text-gray-900">Portal Dewan Juri</h1>
              <p className="text-xs text-gray-500">Penilaian karya peserta berbasis kriteria kompetisi terstandarisasi</p>
            </div>
            <Badge variant="warning" className="text-[10px] uppercase font-bold">
              DEWAN JURI
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500 hidden sm:inline">Juri: <strong>{user?.name}</strong></span>
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              J
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default JudgeLayout;
