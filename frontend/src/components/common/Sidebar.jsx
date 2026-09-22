import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Badge from '../ui/Badge';

export const Sidebar = ({ role = 'participant' }) => {
  const { user, logout } = useAuth();

  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Overview Dashboard', to: '/admin', exact: true },
          { label: 'Kelola Kompetisi', to: '/admin/competitions' },
          { label: 'Peserta & Akun', to: '/admin/participants' },
          { label: 'Verifikasi Pendaftaran', to: '/admin/registrations' },
          { label: 'Verifikasi Pembayaran', to: '/admin/payments' },
          { label: 'Kelola Submissions', to: '/admin/submissions' },
          { label: 'Pengumuman', to: '/admin/announcements' },
          { label: 'FAQ', to: '/admin/faqs' },
          { label: 'Sponsor', to: '/admin/sponsors' },
          { label: 'Pemenang', to: '/admin/winners' },
        ];
      case 'judge':
        return [
          { label: 'Overview Dashboard', to: '/judge', exact: true },
          { label: 'Daftar Karya (Submission)', to: '/judge/submissions' },
          { label: 'Rekap Nilai Juri', to: '/judge/scores' },
        ];
      case 'participant':
      default:
        return [
          { label: 'Dashboard Peserta', to: '/dashboard', exact: true },
          { label: 'Profil Saya', to: '/profile' },
          { label: 'Kompetisi Saya', to: '/my-competitions' },
          { label: 'Tim Saya', to: '/my-team' },
          { label: 'Status Pendaftaran', to: '/registrations' },
          { label: 'Pengumpulan Karya', to: '/submissions' },
          { label: 'Riwayat Pembayaran', to: '/payments' },
          { label: 'Pengumuman Peserta', to: '/announcements' },
        ];
    }
  };

  const links = getLinks();

  const getRoleVariant = () => {
    if (role === 'admin') return 'danger';
    if (role === 'judge') return 'warning';
    return 'primary';
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center text-white font-bold text-base shadow">
            H
          </div>
          <div>
            <span className="font-bold text-gray-900 leading-tight block text-sm">HIMATIF ITC</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Ciayumajakuning</span>
          </div>
        </Link>
        <Badge variant={getRoleVariant()} className="uppercase text-[10px]">
          {role}
        </Badge>
      </div>

      {/* User Info Capsule */}
      <div className="p-4 bg-gray-50/70 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Login sebagai</p>
        <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{user?.name || 'Pengguna'}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Keluar (Logout)
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
