import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  BarChart3, 
  BookOpen, 
  ArrowRight, 
  Trophy, 
  Users, 
  ArrowUpRight 
} from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { COMPETITIONS_DATA } from '../../data/festivalData';

const iconMap = {
  Layout: Layout,
  Code2: Code2,
  Terminal: Terminal,
  ShieldCheck: ShieldCheck,
  BarChart3: BarChart3,
  BookOpen: BookOpen,
};

export const CompetitionSection = () => {
  const [filter, setFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'Semua Lomba' },
    { id: 'mahasiswa', label: 'Jenjang Mahasiswa' },
    { id: 'sma', label: 'Jenjang SMA/SMK' },
  ];

  const filteredCompetitions = COMPETITIONS_DATA.filter((comp) => {
    if (filter === 'all') return true;
    if (filter === 'mahasiswa') return comp.target_level === 'mahasiswa' || comp.target_level === 'all';
    if (filter === 'sma') return comp.target_level === 'sma' || comp.target_level === 'all';
    return true;
  });

  return (
    <section id="competitions" className="relative py-24 sm:py-32 bg-[#17110D] border-b border-[rgba(255,179,107,0.12)] overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(255,106,0,0.08)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHeading
            badge="// 03. COMPETITIONS"
            title="Cabang Lomba"
            highlight="Resmi 2026"
            description="Pilih cabang kompetisi sesuai minat keahlian dan jenjang pendidikan Anda. Seluruh cabang menyediakan panduan teknis dan rubrik terbuka."
            align="left"
          />

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 self-start md:self-end bg-[#100B08] p-1.5 rounded-2xl border border-[rgba(255,179,107,0.15)]">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  filter === tab.id
                    ? 'bg-[#FF6A00] text-white shadow-orange-glow'
                    : 'text-[#C4B3A7] hover:text-[#FFF7F0] hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Competition Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence>
            {filteredCompetitions.map((comp) => {
              const IconComponent = iconMap[comp.icon] || Layout;

              return (
                <motion.div
                  key={comp.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="bg-[#1C1410] border border-[rgba(255,179,107,0.18)] hover:border-[#FF7A1A] rounded-3xl p-6 sm:p-7 flex flex-col justify-between group transition-all duration-300 hover:shadow-orange-glow hover:-translate-y-1 relative"
                >
                  {/* Top Meta Bar */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <span className="font-mono text-[11px] font-semibold text-[#FFB36B] tracking-wide uppercase bg-[#211811] px-2.5 py-1 rounded-lg border border-[rgba(255,179,107,0.15)]">
                        {comp.category_label}
                      </span>
                      <Badge variant="fest" className="text-[11px]">
                        {comp.target_level_label}
                      </Badge>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#211811] to-[#2A1B14] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FFB36B] group-hover:text-white group-hover:bg-[#FF6A00] group-hover:border-[#FF7A1A] transition-all shadow-sm">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors leading-snug">
                          {comp.title}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#C4B3A7] line-clamp-3 leading-relaxed mb-6 font-sans">
                      {comp.shortDescription}
                    </p>
                  </div>

                  {/* Bottom Stats & Action */}
                  <div className="space-y-4 pt-4 border-t border-[rgba(255,179,107,0.12)]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#FFB36B] font-mono font-semibold">
                        <Trophy className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>Hadiah: {comp.prizePool}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#948277] font-mono">
                        <Users className="w-3.5 h-3.5" />
                        <span>{comp.team_format}</span>
                      </div>
                    </div>

                    {/* Link to detail page */}
                    <Link
                      to={`/competitions/${comp.slug}`}
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#211811] hover:bg-[#FF6A00] text-[#FFF7F0] hover:text-white border border-[rgba(255,179,107,0.2)] hover:border-transparent transition-all duration-200 text-xs sm:text-sm font-semibold group/btn"
                    >
                      <span>Lihat Rincian & Ketentuan</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Secondary Global Action */}
        <div className="text-center pt-4">
          <Link to="/competitions">
            <Button variant="secondary" size="md" className="gap-2">
              <span>Buka Katalog Lengkap 6 Cabang Lomba</span>
              <ArrowRight className="w-4 h-4 text-[#FF7A1A]" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default CompetitionSection;
