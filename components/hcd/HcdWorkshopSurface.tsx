import React from 'react';

export const HcdWorkshopSurface: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div data-hcd-workshop-surface className="hcd-workshop-surface relative min-h-full overflow-hidden">
    <div aria-hidden="true" className="hcd-mat-grid absolute inset-0" />
    <div aria-hidden="true" className="hcd-mat-frame absolute inset-3 rounded-[1.6rem] sm:inset-5 sm:rounded-[2rem]" />
    <div aria-hidden="true" className="hcd-mat-label absolute bottom-7 left-8 hidden font-mono text-[8px] font-bold tracking-[0.24em] sm:block">
      ADI AGARWAL / WORKSHOP GRID
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export default HcdWorkshopSurface;
