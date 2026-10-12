import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Award, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import { PRIZE_BREAKDOWN } from '../../data/festivalData';

export const PrizePoolSection = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#17110D] border-b border-[rgba(255,179,107,0.12)] overflow-hidden">
      {/* Cinematic Orange Radial Glow Behind Trophy */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] bg-[radial-gradient(circle,rgba(255,106,0,0.15)_0%,rgba(255,122,26,0.05)_45%,transparent_75%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Banner Box */}
        <div className="bg-gradient-to-b from-[#1C1410] to-[#140E0A] border border-[rgba(255,179,107,0.25)] rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl space-y-10">
          
          {/* Header Label */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#211811] border border-[rgba(255,179,107,0.3)] text-xs font-mono font-bold tracking-wider text-[#FFB36B] uppercase">
              <Trophy className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>TOTAL PRIZE POOL & RECOGNITION</span>
            </div>

            {/* Oversized Typography */}
            <div className="space-y-2">
              <p className="text-4xl sm:text-6xl lg:text-7xl font-black font-display text-gradient-fire tracking-tight leading-none drop-shadow-md">
                RP 50.000.000+
              </p>
              <p className="text-sm sm:text-base text-[#C4B3A7] max-w-xl mx-auto font-sans">
                Total dana pembinaan tunai, trofi kejuaraan, sertifikat berstandar nasional, dan voucher cloud infrastructure bagi para inovator terbaik.
              </p>
            </div>
          </div>

          {/* Prize Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            {PRIZE_BREAKDOWN.map((prize, idx) => (
              <div
                key={idx}
                className="bg-[#211811] border border-[rgba(255,179,107,0.16)] hover:border-[#FF7A1A] rounded-2xl p-6 space-y-3 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#FF6A00] tracking-wider uppercase">
                    {prize.badge}
                  </span>
                  <Award className="w-4 h-4 text-[#FFB36B] group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-lg font-black font-display text-[#FFF7F0]">
                  {prize.rank}
                </h4>
                <p className="text-xs font-semibold text-[#FFB36B]">
                  {prize.reward}
                </p>
                <p className="text-xs text-[#948277] leading-relaxed">
                  {prize.description}
                </p>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="glow" size="lg" className="gap-2">
                <span>Daftar Tim Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/competitions">
              <Button variant="secondary" size="lg" className="gap-2">
                <span>Rincian Hadiah Tiap Kategori</span>
              </Button>
            </Link>
          </div>

          {/* Guarantee info */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#948277] font-mono">
            <ShieldCheck className="w-4 h-4 text-[#FF7A1A]" />
            <span>Seluruh finalis dan peserta mendapatkan E-Certificate resmi bernomor registrasi nasional.</span>
          </div>

        </div>

      </div>
    </section>
  );
};

export default PrizePoolSection;
