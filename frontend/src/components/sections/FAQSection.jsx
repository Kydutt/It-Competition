import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, FileText, MessageSquare } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';
import { FAQ_DATA, FESTIVAL_INFO } from '../../data/festivalData';

export const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openIndex, setOpenIndex] = useState(0); // first item open by default

  const currentQuestions = FAQ_DATA[activeCategory]?.questions || [];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="relative py-24 sm:py-32 bg-[#100B08] border-b border-[rgba(255,179,107,0.12)] overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-[radial-gradient(circle,rgba(255,106,0,0.06)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        
        {/* Section Heading */}
        <SectionHeading
          badge="// 05. FREQUENTLY ASKED"
          title="Pertanyaan yang Sering"
          highlight="Diajukan"
          description="Temukan jawaban cepat seputar persyaratan pendaftaran, berkas administrasi, dan sistem perlombaan."
        />

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {FAQ_DATA.map((cat, idx) => (
            <button
              key={cat.category}
              onClick={() => {
                setActiveCategory(idx);
                setOpenIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeCategory === idx
                  ? 'bg-[#FF6A00] text-white shadow-orange-glow'
                  : 'bg-[#1C1410] text-[#C4B3A7] hover:text-[#FFF7F0] border border-[rgba(255,179,107,0.18)] hover:border-[#FF7A1A]'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* Accordion Container */}
        <div className="space-y-4">
          {currentQuestions.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`bg-[#1C1410] border rounded-2xl transition-colors duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#FF7A1A] shadow-amber-subtle'
                    : 'border-[rgba(255,179,107,0.16)] hover:border-[rgba(255,179,107,0.3)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#FFC58A] focus:ring-inset"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className={`text-base sm:text-lg font-bold font-display transition-colors ${
                    isOpen ? 'text-[#FFB36B]' : 'text-[#FFF7F0]'
                  }`}>
                    {item.q}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[#211811] text-[#FFB36B] border border-[rgba(255,179,107,0.15)] flex-shrink-0 ml-4 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-[#FF6A00] text-white' : ''
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-question-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-[#C4B3A7] leading-relaxed font-sans border-t border-[rgba(255,179,107,0.08)]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Support Help Box */}
        <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-lg font-bold font-display text-[#FFF7F0]">
              Masih Memiliki Pertanyaan Lain?
            </h4>
            <p className="text-xs sm:text-sm text-[#948277]">
              Tim helpdesk resmi kami siap membantu Anda melalui WhatsApp dan email resmi panitia.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={`https://wa.me/${FESTIVAL_INFO.contactWhatsapp.replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="sm" className="gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF7A1A]" />
                <span>Hubungi Panitia</span>
              </Button>
            </a>
            <a href={FESTIVAL_INFO.guidebookUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                <span>Guidebook PDF</span>
              </Button>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FAQSection;
