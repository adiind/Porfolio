import React from 'react';

export type GlassOpticalStrength = 'quiet' | 'balanced' | 'strong';
export type GlassBlurStrength = 'none' | 'soft' | 'medium' | 'strong';

type GlassSurfaceOwnProps<T extends React.ElementType> = {
  as?: T;
  children?: React.ReactNode;
  className?: string;
  strength?: GlassOpticalStrength;
  blur?: GlassBlurStrength;
  highlight?: boolean;
};

export type GlassSurfaceProps<T extends React.ElementType = 'div'> =
  GlassSurfaceOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof GlassSurfaceOwnProps<T>>;

const strengthClasses: Record<GlassOpticalStrength, string> = {
  quiet: 'border-white/10 bg-[#07110f]/55 shadow-[0_18px_52px_rgba(0,0,0,0.28)]',
  balanced: 'border-white/[0.16] bg-[#07110f]/68 shadow-[0_24px_68px_rgba(0,0,0,0.38)]',
  strong: 'border-white/20 bg-[#050d0c]/82 shadow-[0_30px_90px_rgba(0,0,0,0.5)]',
};

const blurClasses: Record<GlassBlurStrength, string> = {
  // 'none' exists so panels stacked on an already-blurred shell can skip a second
  // backdrop-filter pass — nested backdrop layers cost a composited layer each and
  // add nothing visible on top of an opaque surface.
  none: '',
  soft: 'backdrop-blur-sm',
  medium: 'backdrop-blur-md',
  strong: 'backdrop-blur-xl',
};

export function GlassSurface<T extends React.ElementType = 'div'>({
  as,
  children,
  className = '',
  strength = 'balanced',
  blur = 'medium',
  highlight = true,
  ...rest
}: GlassSurfaceProps<T>) {
  const Component = as ?? 'div';
  const highlightClasses = highlight
    ? "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(145deg,rgba(255,255,255,0.11),transparent_28%,transparent_72%,rgba(229,229,90,0.035))] before:content-['']"
    : '';

  return (
    <Component
      className={`relative isolate border ${strengthClasses[strength]} ${blurClasses[blur]} ${highlightClasses} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default GlassSurface;
