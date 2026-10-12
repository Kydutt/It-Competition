import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Terminal } from 'lucide-react';
import Button from '../ui/Button';

export const FinalCTASection = () => {
  return (
    <section className="relative py-28 sm:py-36 bg-[#100B08] overflow-hidden">
      {/* Intense Cinematic Radial Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse,rgba(255,106,0,0.18)_0%,rgba(255,122,26,0.06)_50%,transparent_75%)] pointer-events-none blur-3xl -z-10" />
      
      {/* Background Matrix Linework */}
      <div className="absolute inset-0 fest-grid-pattern opacity-40 pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        
        {/* Edition Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.3)] shadow-[0_0_15px_rgba(255,106,0,0.15)] text-xs font-mono text-[#FFB36B]">
          <Terminal className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span>JOIN THE FUTURE OF TECH // 2026</span>
        </div>

        {/* Oversized Bold Headline */}
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-[#FFF7F0] leading-[1.08]">
          YOUR NEXT BIG IDEA <br />
          <span className="text-gradient-orange">
            STARTS HERE.
          </span>
        </h2>

        {/* Concise Description */}
        <p className="text-base sm:text-lg text-[#C4B3A7] max-w-xl mx-auto font-sans leading-relaxed">
          Jangan lewatkan kesempatan menguji kapabilitas, memperluas wawasan inovasi, dan membawa pulang total hadiah puluhan juta rupiah.
        </p>

        {/* Double CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="glow" size="lg" className="w-full sm:w-auto gap-2 group">
              <span>Daftar Sekarang</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/competitions" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
              <Sparkles className="w-4 h-4 text-[#FFB36B]" />
              <span>Eksplorasi Cabang Lomba</span>
            </Button>
          </Link>
        </div>

        {/* Floating Telemetry Footer Tag */}
        <div className="pt-8 text-xs font-mono text-[#948277]">
          <span>REGISTRATION DEADLINE: 25 MARET 2026 // SLOTS LIMITED</span>
        </div>

      </div>
    </section>
  );
};

export default FinalCTASection;
