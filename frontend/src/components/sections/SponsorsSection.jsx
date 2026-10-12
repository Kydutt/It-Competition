import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import { SPONSORS_DATA } from '../../data/festivalData';

export const SponsorsSection = () => {
  return (
    <section className="relative py-24 sm:py-28 bg-[#17110D] border-b border-[rgba(255,179,107,0.12)] overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,106,0,0.05)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Heading */}
        <SectionHeading
          badge="// 06. PARTNERS & ECOSYSTEM"
          title="Kolaborator &"
          highlight="Mitra Pendukung"
          description="Didukung oleh jaringan ekosistem teknologi, komunitas pengembang regional, dan institusi akademik terkemuka."
        />

        {/* Sponsor Showcase Tiers */}
        <div className="space-y-12">
          {SPONSORS_DATA.map((tierGroup, idx) => (
            <div key={idx} className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[rgba(255,179,107,0.2)]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#FFB36B] font-semibold">
                  {tierGroup.tier}
                </span>
                <span className="h-px w-8 bg-[rgba(255,179,107,0.2)]" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-4xl mx-auto">
                {tierGroup.items.map((partner, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-[#1C1410] border border-[rgba(255,179,107,0.16)] hover:border-[#FF7A1A] rounded-2xl px-6 py-4 flex items-center gap-3.5 transition-all duration-200 group hover:shadow-amber-subtle"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.25)] flex items-center justify-center font-display font-black text-sm text-[#FFB36B] group-hover:text-white group-hover:bg-[#FF6A00] transition-colors">
                      {partner.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors leading-tight">
                        {partner.name}
                      </p>
                      <p className="text-[11px] text-[#948277] font-sans">
                        {partner.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Partnership Invitation Box */}
        <div className="max-w-2xl mx-auto bg-[#1C1410] border border-[rgba(255,179,107,0.15)] rounded-2xl p-6 text-center space-y-2">
          <p className="text-xs font-mono text-[#FFB36B] uppercase tracking-wider">
            Tertarik Menjadi Bagian dari Festival Ini?
          </p>
          <p className="text-xs text-[#948277]">
            Buka peluang kolaborasi sponsorship atau media partner dengan menghubungi sekretariat festival melalui email panitia.
          </p>
        </div>

      </div>
    </section>
  );
};

export default SponsorsSection;
