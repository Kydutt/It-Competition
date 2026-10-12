import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Layers, Award, Terminal, Cpu } from 'lucide-react';

export const AboutSection = () => {
  return (
    <section id="about" className="relative py-24 sm:py-32 bg-[#17110D] border-b border-[rgba(255,179,107,0.12)] overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[radial-gradient(circle,rgba(255,106,0,0.08)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] text-xs font-mono font-bold tracking-wider text-[#FFB36B] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
              <span>// 01. ABOUT THE EVENT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-[#FFF7F0] leading-tight">
              Mewadahi Inovasi Digital Generasi Muda Menuju{' '}
              <span className="text-gradient-orange">
                Masa Depan Teknologi.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#C4B3A7] leading-relaxed font-sans">
              HIMATIF IT Competition (NEXUS TechFest 2026) merupakan festival kompetisi teknologi informasi terbesar se-wilayah Cirebon, Indramayu, Majalengka, Kuningan (Ciayumajakuning) dan terbuka secara nasional.
            </p>

            <p className="text-sm sm:text-base text-[#948277] leading-relaxed">
              Dirancang untuk menjembatani ide-ide teoritis civitas akademika dengan tantangan nyata industri digital. Melalui kurasi standar profesional, peserta ditantang melampaui batasan dalam pemecahan algoritma, perancangan antarmuka, keamanan siber, dan rekayasa perangkat lunak.
            </p>

            {/* Pillar highlights */}
            <div className="pt-4 space-y-3.5">
              {[
                'Standar rubrik evaluasi terakreditasi dewan juri pakar & praktisi',
                'Penyelenggaraan format hybrid fleksibel bagi peserta seluruh nusantara',
                'Sesi mentoring eksklusif dan bedah teknis bersama mentor industri',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#FF6A00]/15 flex items-center justify-center border border-[#FF6A00]/30 text-[#FFB36B]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm sm:text-base text-[#FFF7F0] font-medium font-sans">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Editorial Stat Matrix & Technical Telemetry (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
              {/* Corner Tech Decorative Marker */}
              <div className="absolute top-4 right-4 font-mono text-[10px] text-[#948277] tracking-widest uppercase">
                [SYS_OVERVIEW]
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#211811] p-5 rounded-2xl border border-[rgba(255,179,107,0.12)] space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/15 text-[#FFB36B] flex items-center justify-center mb-2">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-[#FFF7F0]">
                    6 Cabang
                  </div>
                  <div className="text-xs text-[#948277] font-mono uppercase tracking-wider">
                    Lomba Pilihan
                  </div>
                </div>

                <div className="bg-[#211811] p-5 rounded-2xl border border-[rgba(255,179,107,0.12)] space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/15 text-[#FFB36B] flex items-center justify-center mb-2">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-[#FFB36B]">
                    Rp 50Jt+
                  </div>
                  <div className="text-xs text-[#948277] font-mono uppercase tracking-wider">
                    Total Hadiah
                  </div>
                </div>

                <div className="bg-[#211811] p-5 rounded-2xl border border-[rgba(255,179,107,0.12)] space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-[#FFB36B]/15 text-[#FFB36B] flex items-center justify-center mb-2">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-[#FFF7F0]">
                    2 Tingkat
                  </div>
                  <div className="text-xs text-[#948277] font-mono uppercase tracking-wider">
                    Mahasiswa & SMA
                  </div>
                </div>

                <div className="bg-[#211811] p-5 rounded-2xl border border-[rgba(255,179,107,0.12)] space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/15 text-[#FFB36B] flex items-center justify-center mb-2">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-[#FFF7F0]">
                    Hybrid
                  </div>
                  <div className="text-xs text-[#948277] font-mono uppercase tracking-wider">
                    Pelaksanaan
                  </div>
                </div>
              </div>

              {/* Verified Host Badge */}
              <div className="pt-2 border-t border-[rgba(255,179,107,0.12)] flex items-center justify-between text-xs text-[#C4B3A7] font-mono">
                <span>Penyelenggara: HIMATIF</span>
                <span className="text-[#FFB36B]">Official Edition 2026</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
