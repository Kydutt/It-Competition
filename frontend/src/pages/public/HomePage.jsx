import React from 'react';
import HeroSection from '../../components/sections/HeroSection';
import AboutSection from '../../components/sections/AboutSection';
import BenefitsSection from '../../components/sections/BenefitsSection';
import CompetitionSection from '../../components/sections/CompetitionSection';
import TimelineSection from '../../components/sections/TimelineSection';
import PrizePoolSection from '../../components/sections/PrizePoolSection';
import FAQSection from '../../components/sections/FAQSection';
import SponsorsSection from '../../components/sections/SponsorsSection';
import FinalCTASection from '../../components/sections/FinalCTASection';

export const HomePage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. About the Event */}
      <AboutSection />

      {/* 3. Why Participate */}
      <BenefitsSection />

      {/* 4. Competition Showcase */}
      <CompetitionSection />

      {/* 5. Timeline */}
      <TimelineSection />

      {/* 6. Prize Pool */}
      <PrizePoolSection />

      {/* 7. FAQ */}
      <FAQSection />

      {/* 8. Sponsors and Partners */}
      <SponsorsSection />

      {/* 9. Final Call to Action */}
      <FinalCTASection />
    </div>
  );
};

export default HomePage;
