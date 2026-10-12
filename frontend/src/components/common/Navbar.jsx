import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, Terminal } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../ui/Button';

export const Navbar = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'judge') return '/judge';
    return '/dashboard';
  };

  const isHome = location.pathname === '/';

  const handleNavClick = (to, hashId) => {
    setMobileMenuOpen(false);
    if (isHome && hashId) {
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(to);
  };

  const navLinks = [
    { label: 'Beranda', to: '/', hash: '' },
    { label: 'Tentang', to: '/about', hash: 'about' },
    { label: 'Kompetisi', to: '/competitions', hash: 'competitions' },
    { label: 'Timeline', to: '/timeline', hash: 'timeline' },
    { label: 'FAQ', to: '/faq', hash: 'faq' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#100B08]/90 backdrop-blur-md border-b border-[rgba(255,179,107,0.18)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3' 
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Typographic Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white font-black text-xl shadow-orange-glow group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#FFF7F0] block leading-tight font-display">
                NEXUS <span className="text-[#FF6A00]">ITC</span>
              </span>
              <span className="text-[10px] font-mono text-[#FFB36B] uppercase tracking-wider block">
                TECHFEST 2026
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-[#17110D]/70 border border-[rgba(255,179,107,0.12)] px-4 py-1.5 rounded-full backdrop-blur-md">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.to, link.hash)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#C4B3A7] hover:text-[#FFF7F0] hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFC58A]"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Auth & CTA Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to={getDashboardPath()}>
                  <Button variant="secondary" size="sm" className="font-mono text-xs">
                    Dashboard ({role})
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="glow" size="sm" className="text-xs gap-1.5">
                    <span>Daftar Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-[#1C1410] border border-[rgba(255,179,107,0.2)] text-[#FFF7F0] hover:text-[#FFB36B] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[rgba(255,179,107,0.2)] bg-[#17110D]/95 backdrop-blur-xl px-5 pt-4 pb-6 space-y-3 mt-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.to, link.hash)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#FFF7F0] hover:text-[#FFB36B] hover:bg-white/5 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[rgba(255,179,107,0.12)] flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" variant="secondary" size="md">
                    Buka Dashboard ({role})
                  </Button>
                </Link>
                <Button className="w-full" variant="ghost" size="md" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" variant="secondary" size="md">
                    Masuk ke Akun
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" variant="glow" size="md">
                    Daftar Sekarang
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
