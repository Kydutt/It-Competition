import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Badge from '../ui/Badge';

export const Topbar = ({ onToggleSidebar, role = 'participant' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleConfigs = {
    admin: { label: 'ADMINISTRATOR', variant: 'danger', bg: 'bg-rose-950/60 text-rose-400 border-rose-800/60' },
    judge: { label: 'DEWAN JURI', variant: 'warning', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/60' },
    participant: { label: 'PESERTA TIM', variant: 'primary', bg: 'bg-[#FF6A00]/15 text-[#FFB36B] border-[#FF6A00]/40' },
  };

  const roleConfig = roleConfigs[role] || roleConfigs.participant;

  return (
    <header className="sticky top-0 z-30 bg-[#17110D]/90 backdrop-blur-md border-b border-[rgba(255,179,107,0.16)] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-[#211811] text-[#FFF7F0] border border-[rgba(255,179,107,0.2)] focus:outline-none"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleConfig.bg}`}>
            {roleConfig.label}
          </span>
          <span className="text-xs text-[#948277] hidden sm:inline font-mono">
            // SESSION: ACTIVE
          </span>
        </div>
      </div>

      {/* Right: Quick actions, notifications, user avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-[#C4B3A7] hover:text-[#FFB36B] transition-colors"
        >
          <span>Website Publik</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* User avatar & info */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[rgba(255,179,107,0.15)]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center font-bold text-xs text-white uppercase shadow-orange-glow">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#FFF7F0] truncate max-w-[140px] leading-tight">
              {user?.name || 'Pengguna'}
            </p>
            <p className="text-[10px] text-[#948277] font-mono truncate max-w-[140px]">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout quick button */}
        <button
          onClick={handleLogout}
          title="Keluar dari akun"
          className="p-2 rounded-xl bg-[#211811] hover:bg-rose-500/20 text-[#948277] hover:text-rose-400 border border-[rgba(255,179,107,0.15)] transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
