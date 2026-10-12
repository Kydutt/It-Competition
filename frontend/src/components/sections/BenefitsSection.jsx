import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, Users, Rocket, Terminal, ArrowUpRight } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import { BENEFITS_DATA } from '../../data/festivalData';

const iconMap = {
  Cpu: Cpu,
  Sparkles: Sparkles,
  Users: Users,
  Rocket: Rocket,
  Terminal: Terminal,
};

export const BenefitsSection = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#100B08] border-b border-[rgba(255,179,107,0.12)] overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[radial-gradient(circle,rgba(255,122,26,0.06)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Heading */}
        <SectionHeading
          badge="// 02. WHY PARTICIPATE"
          title="Keunggulan Mengikuti"
          highlight="Kompetisi Ini"
          description="Bukan sekadar ajang perlombaan, melainkan akselerator karir dan platform pembuktian kompetensi teknologi terstandarisasi."
        />

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Technical Mastery (Large - 7 cols) */}
          <div className="md:col-span-7 bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-8 sm:p-10 relative overflow-hidden group hover:border-[#FF7A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white shadow-orange-glow">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs text-[#FFB36B] tracking-wider uppercase bg-[#211811] px-3 py-1 rounded-full border border-[rgba(255,179,107,0.15)]">
                [SYS-01 // TECHNICAL SKILL]
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors">
                Akselerasi Keterampilan Teknis Nyata
              </h3>
              <p className="text-[#C4B3A7] text-base leading-relaxed font-sans max-w-xl">
                Tantangan dirancang menyerupai benchmark industri global. Uji keahlian rekayasa algoritma, arsitektur web modern, eksploitasi keamanan siber, dan analisis data cerdas dengan evaluasi langsung dari para praktisi senior.
              </p>
            </div>
          </div>

          {/* Card 2: Recognition & Portfolio (5 cols) */}
          <div className="md:col-span-5 bg-[#17110D] border border-[rgba(255,179,107,0.18)] rounded-3xl p-8 relative overflow-hidden group hover:border-[#FF7A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#211811] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FFB36B]">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs text-[#948277] tracking-wider uppercase">
                [SYS-02 // PORTFOLIO]
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-black font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors">
                Portofolio Nasional Kredibel
              </h3>
              <p className="text-[#C4B3A7] text-sm leading-relaxed font-sans">
                Karya dan pencapaian Anda terdokumentasi dalam rekam jejak resmi tingkat nasional, memperkuat portofolio bagi rekruter dan universitas terkemuka.
              </p>
            </div>
          </div>

          {/* Card 3: Elite Collaboration (4 cols) */}
          <div className="md:col-span-4 bg-[#17110D] border border-[rgba(255,179,107,0.18)] rounded-3xl p-8 relative overflow-hidden group hover:border-[#FF7A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FFB36B]">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-[#948277] uppercase">[SYS-03]</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors">
                Jejaring Kolaboratif
              </h3>
              <p className="text-[#C4B3A7] text-sm leading-relaxed font-sans">
                Bangun relasi dengan ratusan talenta muda potensial, alumni berprestasi, dan komunitas pengembang se-Indonesia.
              </p>
            </div>
          </div>

          {/* Card 4: Real-World Impact (4 cols) */}
          <div className="md:col-span-4 bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-8 relative overflow-hidden group hover:border-[#FF7A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FFB36B]">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-[#948277] uppercase">[SYS-04]</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors">
                Solusi Dampak Nyata
              </h3>
              <p className="text-[#C4B3A7] text-sm leading-relaxed font-sans">
                Setiap tema lomba merespon kebutuhan riil transformasi kota cerdas, efisiensi data, dan ketahanan siber publik.
              </p>
            </div>
          </div>

          {/* Card 5: Frontier Technology (4 cols) */}
          <div className="md:col-span-4 bg-[#17110D] border border-[rgba(255,179,107,0.18)] rounded-3xl p-8 relative overflow-hidden group hover:border-[#FF7A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FFB36B]">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-[#948277] uppercase">[SYS-05]</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors">
                Wawasan Teknologi Terkini
              </h3>
              <p className="text-[#C4B3A7] text-sm leading-relaxed font-sans">
                Dapatkan akses langsung ke metodologi pengembangan masa kini: AI tooling, secure code pipelines, dan scalable design systems.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;
