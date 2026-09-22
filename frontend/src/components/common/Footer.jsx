import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md">
                H
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block">
                  HIMATIF IT Competition
                </span>
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block">
                  Ciayumajakuning 2026
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Platform kompetisi teknologi dan kreativitas tahunan persembahan Himpunan Mahasiswa Teknik Informatika (HIMATIF) untuk mahasiswa dan pelajar SMA/SMK se-Ciayumajakuning.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="px-2 py-1 bg-gray-900 rounded border border-gray-800">Cirebon</span>
              <span className="px-2 py-1 bg-gray-900 rounded border border-gray-800">Indramayu</span>
              <span className="px-2 py-1 bg-gray-900 rounded border border-gray-800">Majalengka</span>
              <span className="px-2 py-1 bg-gray-900 rounded border border-gray-800">Kuningan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/competitions" className="hover:text-brand-400 transition-colors">Daftar Lomba</Link></li>
              <li><Link to="/timeline" className="hover:text-brand-400 transition-colors">Jadwal & Timeline</Link></li>
              <li><Link to="/announcements" className="hover:text-brand-400 transition-colors">Pengumuman Resmi</Link></li>
              <li><Link to="/winners" className="hover:text-brand-400 transition-colors">Hall of Fame</Link></li>
              <li><Link to="/faq" className="hover:text-brand-400 transition-colors">Tanya Jawab (FAQ)</Link></li>
            </ul>
          </div>

          {/* Contact / Socials */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Sekretariat</h4>
            <p className="text-sm text-gray-400 mb-2">
              Gedung HIMATIF Center, Kampus Utama Ciayumajakuning
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Email: <span className="text-gray-300">competition@himatif.org</span>
            </p>
            <div className="pt-2">
              <Link to="/contact" className="text-xs font-semibold text-brand-400 hover:text-brand-300 underline">
                Hubungi Panitia & Dukungan &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>&copy; 2026 HIMATIF IT Competition. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="mt-2 sm:mt-0">Dirancang untuk skalabilitas multi-event Ciayumajakuning.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
