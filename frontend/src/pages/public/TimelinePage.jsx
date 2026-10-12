import React from 'react';
import SectionHeading from '../../components/ui/SectionHeading';
import { TIMELINE_STAGES } from '../../data/festivalData';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

export const TimelinePage = () => {
  return (
    <div className="relative py-28 sm:py-32 bg-[#100B08] overflow-hidden min-h-screen">
      {/* Background Lighting */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,rgba(255,106,0,0.1)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <SectionHeading
          badge="// SCHEDULE // 2026"
          title="Timeline & Agenda"
          highlight="Resmi Lomba"
          description="Catat dan pantau seluruh milestone kompetisi mulai dari periode registrasi hingga Awarding Ceremony."
        />

        {/* Timeline List */}
        <div className="relative border-l-2 border-[rgba(255,179,107,0.2)] ml-4 md:ml-12 space-y-8 py-4">
          {TIMELINE_STAGES.map((step) => {
            const isCurrent = step.status === 'current';

            return (
              <div key={step.step} className="relative pl-6 md:pl-10">
                {/* Node */}
                <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 ${
                  isCurrent 
                    ? 'border-[#FF6A00] bg-[#FF6A00] shadow-orange-glow' 
                    : 'border-[rgba(255,179,107,0.4)] bg-[#100B08]'
                }`} />

                {/* Card */}
                <div className="bg-[#1C1410] p-6 sm:p-8 rounded-3xl border border-[rgba(255,179,107,0.18)] hover:border-[#FF7A1A] transition-all shadow-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#FF6A00] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{step.dates}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                      isCurrent
                        ? 'bg-[#FF6A00]/20 text-[#FFB36B] border border-[#FF6A00]/40'
                        : 'bg-[#211811] text-[#948277] border border-[rgba(255,179,107,0.1)]'
                    }`}>
                      {step.statusLabel}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
                    {step.step}. {step.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#FFB36B]">
                    {step.subtitle}
                  </p>
                  <p className="text-sm text-[#C4B3A7] leading-relaxed font-sans">
                    {step.description}
                  </p>

                  <div className="pt-3 border-t border-[rgba(255,179,107,0.1)] flex flex-wrap gap-4 text-xs text-[#FFF7F0]">
                    {step.highlights.map((h, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default TimelinePage;
