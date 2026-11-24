import React, { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardCheck,
  FolderGit2,
  Swords,
  CalendarDays,
  Calendar,
  Tags,
  Megaphone,
  HelpCircle,
  History,
  Sliders,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Body scroll locking when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileMenuOpen])

  // Auto-close drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/registrations', label: 'Verifikasi Registrasi', icon: ClipboardCheck },
    { to: '/admin/submissions', label: 'Submisi Karya', icon: FolderGit2 },
    { to: '/admin/competitions', label: 'Cabang Kompetisi', icon: Swords },
    { to: '/admin/events', label: 'Event Perhelatan', icon: CalendarDays },
    { to: '/admin/schedules', label: 'Jadwal Kegiatan', icon: Calendar },
    { to: '/admin/categories', label: 'Kategori Lomba', icon: Tags },
    { to: '/admin/announcements', label: 'Pengumuman', icon: Megaphone },
    { to: '/admin/faqs', label: 'FAQ', icon: HelpCircle },
    { to: '/admin/settings', label: 'Pengaturan Sistem', icon: Sliders },
    { to: '/admin/activity-logs', label: 'Audit Log Aktivitas', icon: History },
  ]

  // Get current page label for mobile topbar
  const getCurrentPageTitle = () => {
    const matched = navItems.find((item) =>
      item.to === '/admin/dashboard'
        ? location.pathname === '/admin/dashboard'
        : location.pathname.startsWith(item.to)
    )
    return matched ? matched.label : 'Admin Portal'
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Bar (Compact Header) */}
      <header className="md:hidden bg-[#17243A] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition shrink-0"
            aria-label="Buka menu navigasi admin"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <Link to="/admin/dashboard" className="flex items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#F5C842] flex items-center justify-center text-[#17243A] font-black text-xs shadow-2xs">
                IT
              </div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                IT<span className="text-[#F5C842]">COMP</span>
              </span>
            </Link>
            <span className="text-slate-600 hidden xs:inline">•</span>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px] xs:max-w-[180px]">
              {getCurrentPageTitle()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#F5C842]/20 text-[#F5C842] font-bold border border-[#F5C842]/30 hidden xs:inline-block">
            Admin
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#F5C842] font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#17243A]/70 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation Drawer (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[320px] h-[100dvh] bg-[#17243A] text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out md:static md:w-64 md:h-screen md:sticky md:top-0 md:translate-x-0 md:shadow-none shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Sidebar navigasi admin"
      >
        {/* Mobile Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex md:hidden items-center justify-between shrink-0">
          <Link
            to="/admin/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-[#F5C842] flex items-center justify-center text-[#17243A] font-black text-sm shadow-xs">
              IT
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                IT<span className="text-[#F5C842]">COMP</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Admin Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#F5C842]/20 text-[#F5C842] font-bold border border-[#F5C842]/30">
              Admin
            </span>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition active:bg-slate-700"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Brand Header */}
        <div className="p-5 border-b border-slate-800 hidden md:flex items-center justify-between shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5C842] flex items-center justify-center text-[#17243A] font-black text-base shadow-xs">
              IT
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
                IT<span className="text-[#F5C842]">COMP</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Admin Portal</span>
            </div>
          </Link>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F5C842]/20 text-[#F5C842] border border-[#F5C842]/30">
            <ShieldCheck className="w-3 h-3" />
            v1.0
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overscroll-contain">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase select-none">
            Menu Operasional
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#F5C842] text-[#17243A] font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout (Bottom Pinned) */}
        <div className="p-4 border-t border-slate-800 bg-[#0F172A]/70 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#F5C842] shrink-0 font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              target="_blank"
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Lihat Web</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-red-950/50 text-red-300 border border-red-900/40 hover:bg-red-900/60 active:bg-red-900 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
