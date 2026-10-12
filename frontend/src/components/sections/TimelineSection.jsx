import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import { TIMELINE_STAGES } from '../../data/festivalData';

export const TimelineSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="timeline" className="relative py-24 sm:py-32 bg-[#100B08] border-b border-[rgba(255,179,107,0.12)] overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,106,0,0.07)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Heading */}
        <SectionHeading
          badge="// 04. TIMELINE"
          title="Jadwal & Milestone"
          highlight="Pelaksanaan 2026"
          description="Rangkaian tahapan resmi kompetisi mulai dari pembukaan pendaftaran hingga malam penganugerahan pemenang."
        />

        {/* 1. Desktop Interactive Step Navigator & Detail Card */}
        <div className="hidden lg:block space-y-10">
          
          {/* Horizontal Step Indicator Bar */}
          <div className="relative">
            {/* Progress Connecting Line */}
            <div className="absolute top-6 left-12 right-12 h-0.5 bg-[rgba(255,179,107,0.2)] -z-0" />
            <div 
              className="absolute top-6 left-12 h-0.5 bg-gradient-to-r from-[#FF6A00] to-[#FFB36B] transition-all duration-500 -z-0" 
              style={{ width: `${(activeStep / (TIMELINE_STAGES.length - 1)) * 88}%` }}
            />

            <div className="grid grid-cols-6 gap-2 relative z-10">
              {TIMELINE_STAGES.map((stage, idx) => {
                const isActive = activeStep === idx;
                const isCurrent = stage.status === 'current';

                return (
                  <button
                    key={stage.step}
                    onClick={() => setActiveStep(idx)}
                    className="flex flex-col items-center text-center group focus:outline-none"
                  >
                    {/* Circle Node */}
                    <div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-sm transition-all duration-300 ${
                        isActive
                          ? 'bg-[#FF6A00] text-white shadow-orange-glow scale-110 border-2 border-white/40'
                          : isCurrent
                          ? 'bg-[#211811] text-[#FFB36B] border-2 border-[#FF7A1A]'
                          : 'bg-[#1C1410] text-[#948277] border border-[rgba(255,179,107,0.2)] group-hover:border-[#FF7A1A]'
                      }`}
                    >
                      {stage.step}
                    </div>

                    {/* Step Title Label */}
                    <div className="mt-3 space-y-1">
                      <p className={`text-xs font-bold leading-tight transition-colors line-clamp-1 ${
                        isActive ? 'text-[#FFB36B]' : 'text-[#C4B3A7] group-hover:text-[#FFF7F0]'
                      }`}>
                        {stage.title}
                      </p>
                      <span className="text-[10px] font-mono text-[#948277] block">
                        {stage.dates}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Stage Card for Active Step */}
          {TIMELINE_STAGES[activeStep] && (
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#1C1410] border border-[rgba(255,179,107,0.22)] rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#FF6A00] uppercase tracking-wider bg-[#211811] px-3 py-1 rounded-full border border-[rgba(255,179,107,0.2)]">
                      STAGE {TIMELINE_STAGES[activeStep].step}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#FFB36B] font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{TIMELINE_STAGES[activeStep].dates}</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black font-display text-[#FFF7F0]">
                    {TIMELINE_STAGES[activeStep].title}
                  </h3>
                  <p className="text-sm font-semibold text-[#FFB36B]">
                    {TIMELINE_STAGES[activeStep].subtitle}
                  </p>
                  <p className="text-[#C4B3A7] text-base leading-relaxed font-sans max-w-2xl">
                    {TIMELINE_STAGES[activeStep].description}
                  </p>
                </div>

                <div className="md:col-span-4 bg-[#211811] p-6 rounded-2xl border border-[rgba(255,179,107,0.15)] space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFB36B]">
                    Fokus Aktivitas:
                  </h4>
                  <ul className="space-y-2 text-xs text-[#FFF7F0]">
                    {TIMELINE_STAGES[activeStep].highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#FF6A00] mt-0.5 flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </motion.div>
          )}

        </div>

        {/* 2. Mobile & Tablet Vertical Timeline */}
        <div className="lg:hidden space-y-6 relative">
          <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-[rgba(255,179,107,0.2)] -z-0" />

          {TIMELINE_STAGES.map((stage) => {
            const isCurrent = stage.status === 'current';

            return (
              <div key={stage.step} className="relative flex items-start gap-4 z-10">
                {/* Node */}
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-mono font-bold text-sm ${
                  isCurrent 
                    ? 'bg-[#FF6A00] text-white shadow-orange-glow border-2 border-white/40' 
                    : 'bg-[#1C1410] text-[#FFB36B] border border-[rgba(255,179,107,0.25)]'
                }`}>
                  {stage.step}
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-2xl p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#FFB36B] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{stage.dates}</span>
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF6A00]/20 text-[#FFB36B] border border-[#FF6A00]/40">
                        Sedang Berlangsung
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold font-display text-[#FFF7F0]">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-[#C4B3A7] leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default TimelineSection;
