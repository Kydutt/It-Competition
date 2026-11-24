import React from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  FileText,
} from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#17243A] text-slate-300 border-t border-slate-800 relative overflow-hidden">
      {/* Decorative Subtle Geometry in Footer */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F5C842]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-slate-800">
          {/* Brand Info (Col span 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5C842] flex items-center justify-center text-[#17243A] font-black text-xl shadow-xs">
                IT
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-[#FFFEFA]">
                IT<span className="text-[#F5C842]">COMP</span> 2026
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Platform kompetisi teknologi informasi nasional yang mempertemukan ide kreatif, inovasi perangkat lunak, dan talenta digital terbaik bangsa.
            </p>

            <div className="pt-2 flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#F5C842] shrink-0" />
                <span>Pelaksanaan Hybrid (Daring & Luring di Jakarta)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F5C842] shrink-0" />
                <span>Sekretariat IT COMP, Kampus Pusat, Jakarta</span>
              </div>
            </div>
          </div>

          {/* Quick Nav (Col span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#FFFEFA] tracking-wider uppercase">
              Jelajahi
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-[#F5C842] transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/competitions" className="hover:text-[#F5C842] transition-colors">
                  Katalog Lomba
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="hover:text-[#F5C842] transition-colors">
                  Jadwal Kegiatan
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-[#F5C842] transition-colors">
                  Pengumuman
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#F5C842] transition-colors">
                  Pusat Bantuan
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal (Col span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#FFFEFA] tracking-wider uppercase">
              Legal & Ketentuan
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/terms" className="flex items-center gap-1.5 hover:text-[#F5C842] transition-colors">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Ketentuan Partisipasi</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="flex items-center gap-1.5 hover:text-[#F5C842] transition-colors">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Kebijakan Privasi</span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#F5C842] transition-colors">
                  Panduan Teknis
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact (Col span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#FFFEFA] tracking-wider uppercase">
              Hubungi Panitia
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F5C842] shrink-0" />
                <a href="mailto:kontak@itcomp.id" className="hover:text-[#FFFEFA] transition-colors">
                  panitia@itcomp.test
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F5C842] shrink-0" />
                <span>+62 812-3456-7890 (Helpdesk)</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Layanan informasi dan verifikasi teknis aktif Senin - Jumat pukul 08.00 - 17.00 WIB.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} IT COMP Festival. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-400 transition-colors">
              Syarat & Ketentuan
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">
              Privasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
