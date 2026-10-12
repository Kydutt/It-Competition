import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  Trophy, 
  Calendar, 
  HelpCircle, 
  Building2, 
  Layers, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Award,
  Terminal,
  Cpu
} from 'lucide-react';
import Button from '../components/ui/Button';
import SectionHeading from '../components/ui/SectionHeading';
import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import CompetitionSection from '../components/sections/CompetitionSection';
import TimelineSection from '../components/sections/TimelineSection';
import PrizePoolSection from '../components/sections/PrizePoolSection';
import FAQSection from '../components/sections/FAQSection';
import SponsorsSection from '../components/sections/SponsorsSection';
import FinalCTASection from '../components/sections/FinalCTASection';
import { COMPONENT_DEFINITIONS } from './componentRegistry';

export const DynamicPageRenderer = ({
  page,
  isEditMode = false,
  selectedId = null,
  onSelectElement = () => {},
  onDeleteElement = () => {},
  onDuplicateElement = () => {},
  onMoveElement = () => {},
  onInlineTextChange = () => {},
}) => {
  if (!page || !page.elements || page.elements.length === 0) {
    return (
      <div className="py-24 text-center text-[#948277] font-mono">
        <p>Halaman ini belum memiliki konten elemen.</p>
        {isEditMode && <p className="text-xs text-[#FFB36B] mt-2">Gunakan panel Komponen di sebelah kiri untuk menambahkan section baru.</p>}
      </div>
    );
  }

  // Wrapper for rendering individual element with optional editor chrome
  const renderElement = (el, parentId = null, index = 0, siblingsCount = 1) => {
    if (!el) return null;
    if (el.isHidden && !isEditMode) return null;

    const isSelected = isEditMode && selectedId === el.id;
    const def = COMPONENT_DEFINITIONS[el.type] || {};

    // Inner Element Content
    const innerContent = (() => {
      switch (el.type) {
        case 'section':
          return (
            <section
              id={el.props?.id || undefined}
              className={`relative ${el.props?.paddingY || 'py-20'} ${el.props?.background || 'bg-[#100B08]'} border-b border-[rgba(255,179,107,0.1)] overflow-hidden`}
            >
              {el.props?.glow && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,106,0,0.08)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />
              )}
              <div className={`${el.props?.maxWidth || 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 space-y-8`}>
                {el.children && el.children.map((child, cIdx) => (
                  <React.Fragment key={child.id || cIdx}>
                    {renderElement(child, el.id, cIdx, el.children.length)}
                  </React.Fragment>
                ))}
                {isEditMode && (!el.children || el.children.length === 0) && (
                  <div className="p-8 border border-dashed border-[rgba(255,179,107,0.3)] rounded-2xl text-center text-xs font-mono text-[#948277]">
                    Section ini masih kosong. Klik komponen di panel kiri untuk mengisinya.
                  </div>
                )}
              </div>
            </section>
          );

        case 'container':
          return (
            <div
              className={`${el.props?.padding || 'p-6'} ${el.props?.background || 'bg-[#1C1410]'} ${
                el.props?.border ? 'border border-[rgba(255,179,107,0.18)]' : ''
              } ${el.props?.rounded || 'rounded-2xl'} ${el.props?.align || 'text-left'} space-y-4`}
            >
              {el.children && el.children.map((child, cIdx) => (
                <React.Fragment key={child.id || cIdx}>
                  {renderElement(child, el.id, cIdx, el.children.length)}
                </React.Fragment>
              ))}
            </div>
          );

        case 'card':
          return (
            <div
              className={`${el.props?.padding || 'p-6'} bg-[#1C1410] ${
                el.props?.border ? 'border border-[rgba(255,179,107,0.18)] hover:border-[#FF7A1A]' : ''
              } rounded-2xl transition-all space-y-3`}
            >
              {el.props?.tag && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#FF6A00]/15 text-[#FFB36B] border border-[#FF6A00]/30">
                  {el.props.tag}
                </span>
              )}
              <h3 className="text-lg sm:text-xl font-bold font-display text-[#FFF7F0]">
                {el.props?.title || 'Judul Kartu'}
              </h3>
              <p className="text-sm text-[#C4B3A7] font-sans leading-relaxed">
                {el.props?.description || 'Isi deskripsi kartu informasi.'}
              </p>
            </div>
          );

        case 'heading': {
          const Tag = el.props?.level || 'h2';
          return (
            <Tag
              className={`font-black font-display tracking-tight leading-tight ${
                el.props?.size || 'text-3xl sm:text-4xl'
              } ${el.props?.align || 'text-left'} ${
                el.props?.gradient ? 'text-gradient-orange' : (el.props?.color || 'text-[#FFF7F0]')
              }`}
            >
              {el.props?.text || 'Judul Heading'}
            </Tag>
          );
        }

        case 'text':
          return (
            <p
              className={`font-sans leading-relaxed ${el.props?.size || 'text-base'} ${
                el.props?.color || 'text-[#C4B3A7]'
              } ${el.props?.align || 'text-left'}`}
            >
              {el.props?.content || 'Konten teks paragraf.'}
            </p>
          );

        case 'badge':
          return (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.25)] text-xs font-mono font-bold tracking-wider text-[#FFB36B] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse" />
              <span>{el.props?.text || '// SYSTEM ACTIVE'}</span>
            </div>
          );

        case 'button': {
          const btn = (
            <Button
              variant={el.props?.variant || 'glow'}
              size={el.props?.size || 'md'}
              className="gap-2"
            >
              <span>{el.props?.label || 'Klik Disini'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          );

          if (isEditMode) return <div>{btn}</div>;

          return el.props?.isExternal ? (
            <a href={el.props?.link || '#'} target="_blank" rel="noopener noreferrer">
              {btn}
            </a>
          ) : (
            <Link to={el.props?.link || '#'}>{btn}</Link>
          );
        }

        case 'image':
          return (
            <div className={`overflow-hidden ${el.props?.rounded || 'rounded-2xl'} border border-[rgba(255,179,107,0.18)] shadow-lg`}>
              <img
                src={el.props?.url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'}
                alt={el.props?.alt || 'Visual Image'}
                className={`w-full ${el.props?.aspectRatio || 'aspect-video'} object-cover`}
                loading="lazy"
              />
            </div>
          );

        // Dynamic Blocks
        case 'hero_block':
          return (
            <div className="pt-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.28)] text-xs font-mono text-[#FFB36B]">
                  <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping" />
                  <span className="font-bold tracking-wider uppercase">{el.props?.badgeText || 'EDITION 2026'}</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#FFF7F0] leading-tight">
                  {el.props?.headline1 || 'SHAPE THE'} <br />
                  {el.props?.headline2 || 'FUTURE OF'} <br />
                  <span className="text-gradient-orange">{el.props?.headlineAccent || 'INNOVATION.'}</span>
                </h1>
                <p className="text-base sm:text-lg text-[#C4B3A7] max-w-xl leading-relaxed font-sans">
                  {el.props?.description || 'Kompetisi teknologi informasi dan festival inovasi digital bergengsi se-Indonesia.'}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link to={el.props?.primaryBtnLink || '/register'}>
                    <Button variant="glow" size="lg" className="gap-2">
                      <span>{el.props?.primaryBtnText || 'Daftar Sekarang'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={el.props?.secondaryBtnLink || '/competitions'}>
                    <Button variant="secondary" size="lg" className="gap-2">
                      <Sparkles className="w-4 h-4 text-[#FFB36B]" />
                      <span>{el.props?.secondaryBtnText || 'Jelajahi Lomba'}</span>
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#1C1410] via-[#211811] to-[#17110D] border border-[rgba(255,179,107,0.35)] shadow-[0_0_35px_rgba(255,106,0,0.3)] flex items-center justify-center relative">
                  <div className="text-center p-6 space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center shadow-orange-glow text-white font-black text-2xl">
                      N
                    </div>
                    <div className="font-mono text-xs font-bold text-[#FFB36B] tracking-widest">
                      NEXUS // 2026
                    </div>
                    <div className="text-[10px] text-[#948277] font-mono tracking-wider">
                      FESTIVAL PORTAL
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'about_block':
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] text-xs font-mono font-bold text-[#FFB36B]">
                  <span>{el.props?.badgeText || '// 01. ABOUT'}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black font-display text-[#FFF7F0] leading-tight">
                  {el.props?.title || 'Mewadahi Inovasi Digital'}
                </h2>
                <p className="text-base text-[#C4B3A7] leading-relaxed font-sans">
                  {el.props?.story || 'HIMATIF IT Competition & Technology Festival (NEXUS ITC 2026)...'}
                </p>
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {[
                  { val: el.props?.stat1Val || '6 Cabang', lbl: el.props?.stat1Lbl || 'Lomba Pilihan', icon: Layers },
                  { val: el.props?.stat2Val || 'Rp 50Jt+', lbl: el.props?.stat2Lbl || 'Total Hadiah', icon: Award },
                  { val: el.props?.stat3Val || '2 Tingkat', lbl: el.props?.stat3Lbl || 'Mahasiswa & SMA', icon: Cpu },
                  { val: el.props?.stat4Val || 'Hybrid', lbl: el.props?.stat4Lbl || 'Pelaksanaan', icon: Terminal },
                ].map((st, i) => {
                  const Icon = st.icon;
                  return (
                    <div key={i} className="bg-[#1C1410] p-5 rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-1">
                      <Icon className="w-5 h-5 text-[#FF7A1A] mb-2" />
                      <div className="text-2xl font-black font-display text-[#FFF7F0]">{st.val}</div>
                      <div className="text-xs font-mono text-[#948277] uppercase">{st.lbl}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );

        case 'competition_list':
          return <CompetitionSection />;

        case 'timeline_block':
          return <TimelineSection />;

        case 'prizepool_block':
          return <PrizePoolSection />;

        case 'faq_block':
          return <FAQSection />;

        case 'sponsor_block':
          return <SponsorsSection />;

        case 'cta_box':
          return <FinalCTASection />;

        default:
          return (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-xs font-mono text-red-300">
              Komponen tidak terdaftar: {el.type}
            </div>
          );
      }
    })();

    // In Public Mode, return element cleanly
    if (!isEditMode) {
      return innerContent;
    }

    // In Edit Mode, attach editor selection and hover controls
    return (
      <div
        key={el.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement(el.id);
        }}
        className={`relative transition-all duration-150 group/editor cursor-pointer ${
          isSelected
            ? 'ring-2 ring-[#FF6A00] ring-offset-2 ring-offset-[#100B08] shadow-[0_0_25px_rgba(255,106,0,0.35)]'
            : 'hover:outline hover:outline-1 hover:outline-[#FF7A1A]/40'
        }`}
      >
        {/* Floating Action Overlay Header when Selected */}
        {isSelected && (
          <div className="absolute -top-8 left-0 z-40 flex items-center gap-1 bg-[#100B08] border border-[#FF6A00] rounded-lg px-2 py-0.5 shadow-xl text-xs font-mono pointer-events-auto">
            <span className="text-[#FFB36B] font-bold uppercase tracking-wider text-[10px]">
              {def.label || el.type}
            </span>
            <div className="h-3 w-px bg-[rgba(255,179,107,0.3)] mx-1" />
            {index > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveElement(el.id, 'up');
                }}
                className="p-1 text-[#C4B3A7] hover:text-white transition-colors"
                title="Pindahkan Ke Atas"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
            {index < siblingsCount - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveElement(el.id, 'down');
                }}
                className="p-1 text-[#C4B3A7] hover:text-white transition-colors"
                title="Pindahkan Ke Bawah"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateElement(el.id);
              }}
              className="p-1 text-[#C4B3A7] hover:text-white transition-colors"
              title="Duplikasi Elemen"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteElement(el.id);
              }}
              className="p-1 text-red-400 hover:text-red-300 transition-colors ml-1"
              title="Hapus Elemen"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* The rendered component */}
        {innerContent}
      </div>
    );
  };

  return (
    <div className="dynamic-page-canvas w-full">
      {page.elements.map((el, idx) => (
        <React.Fragment key={el.id || idx}>
          {renderElement(el, null, idx, page.elements.length)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default DynamicPageRenderer;
