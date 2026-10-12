import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Scale, 
  Calendar, 
  Megaphone, 
  BarChart3, 
  FolderCheck, 
  UserCheck, 
  CheckSquare, 
  LogOut,
  X,
  FileText
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const Sidebar = ({ role = 'participant', isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Peserta & Akun', to: '/admin/participants', icon: Users },
          { label: 'Kelola Kompetisi', to: '/admin/competitions', icon: Trophy },
          { label: 'Dewan Juri', to: '/admin/judges', icon: Scale },
          { label: 'Jadwal & Milestone', to: '/admin/schedule', icon: Calendar },
          { label: 'Pengumuman', to: '/admin/announcements', icon: Megaphone },
          { label: 'Laporan & Rekap', to: '/admin/reports', icon: BarChart3 },
        ];
      case 'judge':
        return [
          { label: 'Overview Penilaian', to: '/judge/dashboard', icon: LayoutDashboard },
          { label: 'Lomba Ditugaskan', to: '/judge/competitions', icon: Trophy },
          { label: 'Evaluasi Karya', to: '/judge/evaluations', icon: CheckSquare },
          { label: 'Rekap Nilai', to: '/judge/results', icon: BarChart3 },
        ];
      case 'participant':
      default:
        return [
          { label: 'Overview', to: '/participant/dashboard', icon: LayoutDashboard },
          { label: 'Eksplorasi Lomba', to: '/participant/competitions', icon: Trophy },
          { label: 'Pendaftaran Saya', to: '/participant/registrations', icon: FolderCheck },
          { label: 'Jadwal & Agenda', to: '/participant/schedule', icon: Calendar },
          { label: 'Pengumuman', to: '/participant/announcements', icon: Megaphone },
          { label: 'Profil Saya', to: '/participant/profile', icon: UserCheck },
        ];
    }
  };

  const links = getLinks();

  const content = (
    <div className="flex flex-col h-full bg-[#17110D] border-r border-[rgba(255,179,107,0.16)] w-64 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[rgba(255,179,107,0.14)] flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white font-black text-lg shadow-orange-glow group-hover:scale-105 transition-transform">
            N
          </div>
          <div>
            <span className="font-black font-display text-sm tracking-tight text-[#FFF7F0] block leading-tight">
              NEXUS <span className="text-[#FF6A00]">ITC</span>
            </span>
            <span className="text-[10px] font-mono text-[#FFB36B] uppercase tracking-wider block">
              PORTAL // 2026
            </span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden text-[#948277] hover:text-[#FFF7F0] p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Information Badge */}
      <div className="p-4 mx-3 my-3 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-1">
        <span className="text-[10px] font-mono text-[#948277] uppercase block">
          MASUK SEBAGAI:
        </span>
        <p className="text-sm font-bold font-display text-[#FFF7F0] truncate">
          {user?.name || 'Pengguna'}
        </p>
        <p className="text-xs text-[#FFB36B] font-mono capitalize">
          {user?.role || role}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF6A00] text-white shadow-orange-glow font-bold'
                    : 'text-[#C4B3A7] hover:text-[#FFF7F0] hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-3 border-t border-[rgba(255,179,107,0.12)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex min-h-screen shrink-0 sticky top-0 h-screen">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative z-10 w-64 h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
