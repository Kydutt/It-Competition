import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageSquare, FileText } from 'lucide-react';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import { FAQ_DATA, FESTIVAL_INFO } from '../../data/festivalData';
import { useBuilderPage } from '../../builder/useBuilderPage';
import DynamicPageRenderer from '../../builder/DynamicPageRenderer';

export const FaqPage = () => {
  const builderPage = useBuilderPage('faq');
  const [activeCategory, setActiveCategory] = useState(0);
  const [openIndex, setOpenIndex] = useState(0);

  if (builderPage && builderPage.elements && builderPage.elements.length > 0 && builderPage.status === 'published') {
    return (
      <div className="relative overflow-hidden min-h-screen">
        <DynamicPageRenderer page={builderPage} isEditMode={false} />
      </div>
    );
  }

  const currentQuestions = FAQ_DATA[activeCategory]?.questions || [];


  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="relative py-28 sm:py-32 bg-[#100B08] overflow-hidden min-h-screen">
      {/* Background Lighting */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,rgba(255,106,0,0.1)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        
        {/* Header */}
        <SectionHeading
          badge="// HELP DESK // FAQ"
          title="Tanya Jawab &"
          highlight="Pusat Informasi"
          description="Pertanyaan yang sering diajukan seputar persyaratan pendaftaran, pembentukan tim, dan mekanisme teknis perlombaan."
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

        {/* Support Card */}
        <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-lg font-bold font-display text-[#FFF7F0]">
              Butuh Penjelasan Teknis Lainnya?
            </h4>
            <p className="text-xs sm:text-sm text-[#948277]">
              Hubungi tim helpdesk panitia via WhatsApp atau unduh panduan teknis lengkap.
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
                <span>Chat Panitia</span>
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
    </div>
  );
};

export default FaqPage;
