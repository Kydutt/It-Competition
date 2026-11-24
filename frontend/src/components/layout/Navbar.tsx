import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Kompetisi', path: '/competitions' },
    { name: 'Jadwal', path: '/schedule' },
    { name: 'Pengumuman', path: '/announcements' },
    { name: 'FAQ', path: '/faq' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#FFFEFA]/90 backdrop-blur-md border-b border-[#E9E5DA] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[#17243A] flex items-center justify-center text-[#F5C842] shadow-xs group-hover:scale-105 group-hover:rotate-3 transition-transform">
              <span className="font-black text-xl tracking-tighter">IT</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[#17243A] leading-tight">
                IT<span className="text-[#E8AD22]">COMP</span>
              </span>
              <span className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase">
                Festival 2026
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-[#FAF9F5] p-1.5 rounded-full border border-[#E9E5DA]">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#F5C842] text-[#17243A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#17243A] hover:bg-[#FFFEFA]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-bold text-sm">
                Masuk
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="primary"
                size="sm"
                className="font-bold text-sm shadow-xs hover:shadow"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Daftar Akun
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-[#17243A] hover:bg-[#FFF4CE] focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#E9E5DA] bg-[#FFFEFA] px-5 pt-4 pb-6 space-y-4 shadow-lg animate-fadeIn">
          <nav className="flex flex-col space-y-1.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                    isActive
                      ? 'bg-[#F5C842] text-[#17243A]'
                      : 'text-[#64748B] hover:bg-[#FAF9F5] hover:text-[#17243A]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#E9E5DA] flex flex-col gap-2.5">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
              <Button variant="outline" size="md" className="w-full justify-center">
                Masuk
              </Button>
            </Link>
            <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
              <Button variant="primary" size="md" className="w-full justify-center" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Daftar Akun
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
