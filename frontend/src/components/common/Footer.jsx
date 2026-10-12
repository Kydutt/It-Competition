import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Mail, Phone, ExternalLink, ArrowUpRight } from 'lucide-react';
import { FESTIVAL_INFO, COMPETITIONS_DATA } from '../../data/festivalData';

export const Footer = () => {
  return (
    <footer className="bg-[#100B08] text-[#C4B3A7] border-t border-[rgba(255,179,107,0.16)] relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[radial-gradient(circle,rgba(255,106,0,0.08)_0%,transparent_70%)] pointer-events-none blur-2xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Col 1: Branding & Description (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white font-black text-xl shadow-orange-glow">
                N
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-[#FFF7F0] block leading-tight font-display">
                  NEXUS <span className="text-[#FF6A00]">ITC</span>
                </span>
                <span className="text-[10px] font-mono text-[#FFB36B] uppercase tracking-wider block">
                  EDITION 2026 // TECH FESTIVAL
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#948277] max-w-sm leading-relaxed font-sans">
              Festival kompetisi teknologi tahunan persembahan HIMATIF. Wadah pembuktian inovasi, karya rekayasa perangkat lunak, dan keunggulan digital bagi talenta muda Indonesia.
            </p>

            {/* Region Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-[#FFB36B]">
              <span className="px-2.5 py-1 bg-[#1C1410] rounded-lg border border-[rgba(255,179,107,0.15)]">Cirebon</span>
              <span className="px-2.5 py-1 bg-[#1C1410] rounded-lg border border-[rgba(255,179,107,0.15)]">Indramayu</span>
              <span className="px-2.5 py-1 bg-[#1C1410] rounded-lg border border-[rgba(255,179,107,0.15)]">Majalengka</span>
              <span className="px-2.5 py-1 bg-[#1C1410] rounded-lg border border-[rgba(255,179,107,0.15)]">Kuningan</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFF7F0]">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-[#C4B3A7]">
              <li><Link to="/" className="hover:text-[#FFB36B] transition-colors">Beranda</Link></li>
              <li><Link to="/about" className="hover:text-[#FFB36B] transition-colors">Tentang Acara</Link></li>
              <li><Link to="/competitions" className="hover:text-[#FFB36B] transition-colors">Daftar Lomba</Link></li>
              <li><Link to="/timeline" className="hover:text-[#FFB36B] transition-colors">Timeline Resmi</Link></li>
              <li><Link to="/faq" className="hover:text-[#FFB36B] transition-colors">Pusat Bantuan (FAQ)</Link></li>
            </ul>
          </div>

          {/* Col 3: Competitions Shortcuts (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFF7F0]">
              Cabang Lomba
            </h4>
            <ul className="space-y-2 text-sm text-[#C4B3A7]">
              {COMPETITIONS_DATA.slice(0, 5).map((comp) => (
                <li key={comp.slug}>
                  <Link 
                    to={`/competitions/${comp.slug}`} 
                    className="hover:text-[#FFB36B] transition-colors flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{comp.title}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#948277] group-hover:text-[#FF6A00] opacity-0 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Helpdesk (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFF7F0]">
              Sekretariat
            </h4>
            <div className="space-y-2 text-xs text-[#948277]">
              <p>Gedung HIMATIF Center, Ciayumajakuning, Jawa Barat</p>
              <p className="flex items-center gap-1.5 text-[#C4B3A7]">
                <Mail className="w-3.5 h-3.5 text-[#FF7A1A]" />
                <span>{FESTIVAL_INFO.contactEmail}</span>
              </p>
              <p className="flex items-center gap-1.5 text-[#C4B3A7]">
                <Phone className="w-3.5 h-3.5 text-[#FF7A1A]" />
                <span>{FESTIVAL_INFO.contactWhatsapp}</span>
              </p>
            </div>
            <div className="pt-2">
              <a 
                href={FESTIVAL_INFO.guidebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#FFB36B] hover:text-white underline font-mono"
              >
                <span>Unduh Guidebook Resmi</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[rgba(255,179,107,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#948277]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYS_STATUS: NOMINAL // HYBRID EVENT ENGINE READY</span>
          </div>

          <p>&copy; 2026 HIMATIF IT Competition. All Rights Reserved.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
