import React, { useState, useEffect } from 'react'
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UploadCloud,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { participantService } from '../../services/participantService'

export const ParticipantLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread notification count
  useEffect(() => {
    participantService
      .getNotifications(1)
      .then((res) => {
        if (res.meta && typeof res.meta.unread_count === 'number') {
          setUnreadCount(res.meta.unread_count)
        }
      })
      .catch((err) => console.warn('Failed to load notifications count:', err))
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/participant/dashboard', icon: LayoutDashboard },
    { name: 'Pendaftaran Saya', path: '/participant/registrations', icon: ClipboardList },
    { name: 'Manajemen Tim', path: '/participant/teams', icon: Users },
    { name: 'Submisi Karya', path: '/participant/submissions', icon: UploadCloud },
    {
      name: 'Notifikasi',
      path: '/participant/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: 'Profil Saya', path: '/participant/profile', icon: UserIcon },
  ]

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-[#FFF4CE] text-[#17243A] shadow-2xs font-bold'
        : 'text-[#64748B] hover:bg-[#FAF9F5] hover:text-[#17243A]'
    }`

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#FFFEFA] border-r border-[#E9E5DA] shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-18 flex items-center px-6 border-b border-[#E9E5DA] gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#17243A] flex items-center justify-center text-[#F5C842] shadow-xs font-black text-lg">
            IT
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-[#17243A]">
              IT<span className="text-[#E8AD22]">COMP</span>
            </span>
            <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Portal Peserta
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-[#E9E5DA]">
          <div className="flex items-center gap-3 p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E9E5DA]">
            <div className="w-9 h-9 rounded-full bg-[#FFF4CE] text-[#17243A] border border-[#F5C842]/40 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#17243A] truncate">{user?.name}</p>
              <p className="text-[11px] text-[#64748B] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} className={linkClass}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F5C842] text-[#17243A]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#E9E5DA] space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:bg-[#FAF9F5] hover:text-[#17243A] transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#64748B]" />
            <span>Lihat Website Publik</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#FFFEFA] border-b border-[#E9E5DA] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#17243A] hover:bg-[#FFF4CE]"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-[#17243A]">
              IT Competition Management
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/participant/notifications"
              className="relative p-2 rounded-full text-[#64748B] hover:text-[#17243A] hover:bg-[#FAF9F5] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F5C842] ring-2 ring-[#FFFEFA]" />
              )}
            </Link>

            <div className="h-6 w-px bg-[#E9E5DA] hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFF4CE] text-[#17243A] border border-[#F5C842]/40 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-[#17243A] hidden sm:inline truncate max-w-[120px]">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#17243A]/50 backdrop-blur-xs"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-72 bg-[#FFFEFA] flex flex-col h-full shadow-2xl z-10">
              <div className="h-16 flex items-center justify-between px-5 border-b border-[#E9E5DA]">
                <span className="font-extrabold text-base text-[#17243A]">
                  IT<span className="text-[#E8AD22]">COMP</span> Portal
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-lg text-[#64748B] hover:text-[#17243A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-[#E9E5DA] bg-[#FAF9F5]">
                <p className="text-xs font-bold text-[#17243A]">{user?.name}</p>
                <p className="text-[11px] text-[#64748B]">{user?.email}</p>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={linkClass}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F5C842] text-[#17243A]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-[#E9E5DA] space-y-2">
                <Link
                  to="/"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#FAF9F5] rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Lihat Website Publik</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
