import React from 'react';
import GlassSurface from './ui/GlassSurface';
import AnalyticsPreferences from './AnalyticsPreferences';
import { useContentEngagement } from '../hooks/useContentEngagement';

const PortfolioFooter: React.FC = () => {
  const engagementRef = useContentEngagement<HTMLElement>({
    contentType: 'section',
    contentId: 'footer',
    observeVisibility: true,
  });

  return (
    <footer
      ref={engagementRef}
      id="footer"
      data-portfolio-footer
      className="flex min-h-[42vh] w-full items-center justify-center px-6 py-24 md:min-h-[52vh] md:py-32"
    >
      <GlassSurface
        strength="balanced"
        blur="strong"
        className="w-full max-w-2xl rounded-[2rem] px-6 py-9 text-center md:px-10 md:py-12"
      >
        <p className="text-balance text-sm leading-relaxed text-white/78 md:text-base">
          Made with AI and my own skills—an ongoing experiment, not a final measure of either.
        </p>
        <AnalyticsPreferences />
      </GlassSurface>
    </footer>
  );
};

export default PortfolioFooter;
