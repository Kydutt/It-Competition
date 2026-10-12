import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ChevronDown, Trophy, Users, Calendar, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import { useWebsiteConfig } from '../../context/WebsiteConfigContext';

export const HeroSection = () => {
  const { config } = useWebsiteConfig();
  const hero = config?.hero || {};
  const general = config?.general || {};

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden bg-[#100B08] pt-24 pb-16 border-b border-[rgba(255,179,107,0.12)]">
      {/* 1. Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[850px] sm:h-[850px] bg-[radial-gradient(circle,rgba(255,106,0,0.14)_0%,rgba(255,122,26,0.06)_40%,transparent_70%)] pointer-events-none blur-3xl -z-10" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-[radial-gradient(circle,rgba(255,179,107,0.06)_0%,transparent_70%)] pointer-events-none blur-2xl -z-10" />
      
      {/* 2. Technical Grid & Scanline Pattern */}
      <div className="absolute inset-0 fest-grid-pattern opacity-60 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Copy & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Edition & System Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.28)] shadow-[0_0_15px_rgba(255,106,0,0.12)] text-xs font-mono text-[#FFB36B]"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping" />
              <span className="font-bold tracking-wider uppercase">
                {hero.badgeText || general.editionTag || 'EDITION 2026 // NATIONAL TECHFEST'}
              </span>
              <span className="text-[rgba(255,179,107,0.4)]">|</span>
              <span className="text-[#C4B3A7] hidden sm:inline">
                {general.editionType || 'HYBRID FESTIVAL'}
              </span>
            </motion.div>

            {/* Oversized Cinematic Headline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-1"
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-[#FFF7F0] leading-[1.05]">
                {hero.headlineLine1 || 'SHAPE THE'} <br />
                {hero.headlineLine2 || 'FUTURE OF'} <br />
                <span className="text-gradient-orange drop-shadow-sm">
                  {hero.headlineAccent || 'INNOVATION.'}
                </span>
              </h1>
            </motion.div>

            {/* Concise Supporting Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#C4B3A7] max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans"
            >
              {hero.description || 'Where technology meets bold creativity, ambitious minds collaborate, and breakthrough digital architectures redefine the future of Ciayumajakuning and Indonesia.'}
            </motion.p>

            {/* Primary & Secondary Action CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <Link to={hero.primaryCtaLink || '/register'} className="w-full sm:w-auto">
                <Button variant="glow" size="lg" className="w-full sm:w-auto gap-2 group">
                  <span>{hero.primaryCtaText || 'Daftar Sekarang'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => {
                  if (hero.secondaryCtaLink?.startsWith('#')) {
                    scrollToSection(hero.secondaryCtaLink.substring(1));
                  } else {
                    scrollToSection('competitions');
                  }
                }}
                className="w-full sm:w-auto gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#FFB36B]" />
                <span>{hero.secondaryCtaText || 'Eksplorasi Cabang Lomba'}</span>
              </Button>
            </motion.div>


            {/* Technical Verification Status */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#948277] font-mono"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF7A1A]" />
                <span>Terakreditasi Institusi Resmi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[#C4B3A7]">Portal Pendaftaran Aktif</span>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Abstract Futuristic Tech Visual (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center"
            >
              {/* Outer Rotating Cyber Orbital Ring */}
              <div className="absolute inset-0 rounded-full border border-[rgba(255,179,107,0.2)] animate-[spin_25s_linear_infinite]" />
              
              {/* Middle Dashed Ring */}
              <div className="absolute inset-6 rounded-full border border-dashed border-[#FF7A1A]/40 animate-[spin_18s_linear_infinite_reverse]" />
              
              {/* Inner Glowing Hex / Radial Frame */}
              <div className="absolute inset-16 rounded-full bg-gradient-to-tr from-[#1C1410] via-[#211811] to-[#17110D] border border-[rgba(255,179,107,0.35)] shadow-[0_0_35px_rgba(255,106,0,0.3)] flex items-center justify-center">
                {/* Central Emblem Core */}
                <div className="relative text-center p-6 space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center shadow-orange-glow">
                    <span className="font-display font-black text-2xl text-white">N</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-[#FFB36B] tracking-widest">
                    NEXUS // 2026
                  </div>
                  <div className="text-[10px] text-[#948277] font-mono tracking-wider">
                    TECH FESTIVAL
                  </div>
                </div>
              </div>

              {/* Floating Telemetry Coordinates */}
              <div className="absolute -top-2 left-4 px-3 py-1 rounded bg-[#17110D]/90 border border-[rgba(255,179,107,0.25)] text-[10px] font-mono text-[#FFB36B] backdrop-blur-md">
                SYS: ACTIVE // v2.6
              </div>
              <div className="absolute -bottom-2 right-4 px-3 py-1 rounded bg-[#17110D]/90 border border-[rgba(255,179,107,0.25)] text-[10px] font-mono text-[#FFB36B] backdrop-blur-md">
                LOC: CIAYUMAJAKUNING
              </div>
            </motion.div>
          </div>

        </div>

        {/* 3. Event Key Metadata Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-[rgba(255,179,107,0.16)] grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#948277]">
              <Trophy className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>{hero.highlightStats?.[0]?.label || 'Total Hadiah'}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-display text-[#FFF7F0]">
              {hero.highlightStats?.[0]?.value || 'Rp 50.000.000+'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#948277]">
              <Users className="w-3.5 h-3.5 text-[#FF7A1A]" />
              <span>{hero.highlightStats?.[1]?.label || 'Jenjang Peserta'}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-display text-[#FFF7F0]">
              {hero.highlightStats?.[1]?.value || 'Mahasiswa & SMA'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#948277]">
              <Calendar className="w-3.5 h-3.5 text-[#FFB36B]" />
              <span>Periode Lomba</span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-display text-[#FFF7F0]">
              {general.eventDates || 'Februari - Mei 2026'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#948277]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>{hero.highlightStats?.[2]?.label || 'Cabang Utama'}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-display text-[#FFF7F0]">
              {hero.highlightStats?.[2]?.value || '6 Kategori Kompetisi'}
            </p>
          </div>
        </motion.div>

        {/* 4. Subtle Scroll Indicator */}
        <div className="pt-10 flex justify-center">
          <button 
            onClick={() => scrollToSection('about')} 
            className="flex flex-col items-center gap-1.5 text-xs text-[#948277] hover:text-[#FFB36B] transition-colors group focus:outline-none"
            aria-label="Scroll to About section"
          >
            <span className="font-mono text-[11px] tracking-widest uppercase">Eksplorasi</span>
            <ChevronDown className="w-4 h-4 text-[#FF7A1A] animate-bounce group-hover:text-[#FF6A00]" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
