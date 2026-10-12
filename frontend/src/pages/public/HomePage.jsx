import React, { useMemo } from 'react';
import { useWebsiteConfig } from '../../context/WebsiteConfigContext';
import { useBuilderPage } from '../../builder/useBuilderPage';
import DynamicPageRenderer from '../../builder/DynamicPageRenderer';
import HeroSection from '../../components/sections/HeroSection';
import AboutSection from '../../components/sections/AboutSection';
import BenefitsSection from '../../components/sections/BenefitsSection';
import CompetitionSection from '../../components/sections/CompetitionSection';
import TimelineSection from '../../components/sections/TimelineSection';
import PrizePoolSection from '../../components/sections/PrizePoolSection';
import FAQSection from '../../components/sections/FAQSection';
import SponsorsSection from '../../components/sections/SponsorsSection';
import FinalCTASection from '../../components/sections/FinalCTASection';

const SECTION_COMPONENTS = {
  hero: HeroSection,
  about: AboutSection,
  benefits: BenefitsSection,
  competitions: CompetitionSection,
  timeline: TimelineSection,
  prizePool: PrizePoolSection,
  faq: FAQSection,
  sponsors: SponsorsSection,
  finalCta: FinalCTASection,
};

export const HomePage = () => {
  const { config } = useWebsiteConfig();
  const builderPage = useBuilderPage('home');

  const orderedSections = useMemo(() => {
    if (!config?.sections || !Array.isArray(config.sections)) {
      return Object.keys(SECTION_COMPONENTS).map((key) => ({ key, enabled: true }));
    }
    return [...config.sections]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .filter((sec) => sec.enabled !== false);
  }, [config?.sections]);

  // If a published Visual Builder page is available, render via DynamicPageRenderer
  if (builderPage && builderPage.elements && builderPage.elements.length > 0 && builderPage.status === 'published') {
    return (
      <div className="relative overflow-hidden">
        <DynamicPageRenderer page={builderPage} isEditMode={false} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {orderedSections.map((sec) => {
        const Component = SECTION_COMPONENTS[sec.key || sec.id];
        if (!Component) return null;
        return <Component key={sec.id || sec.key} sectionConfig={sec} />;
      })}
    </div>
  );
};

export default HomePage;


