import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type CuttingMatDensity = 'auto' | 'compact' | 'comfortable';

export interface CuttingMatSurfaceProps {
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
  density?: CuttingMatDensity;
  /** Perpetual float/tilt. Turn off when the mat hosts glass panels or scrollable
   *  dialog content — the repeating transform forces every nested backdrop-filter
   *  layer above it to re-rasterise each frame, which reads as flicker. */
  float?: boolean;
}

// Palette and layout are adapted from the Classic preset at cutting-mat-generator.vercel.app.
// Geometry is measured in rendered pixels so the SVG viewBox never stretches square cells.
const matAngles = [15, 30, 45, 60] as const;
const matRadii = [180, 320, 500] as const;
const matCutMarks = [
  { x1: 0.155, y1: 0.36, x2: 0.303, y2: 0.323 },
  { x1: 0.642, y1: 0.398, x2: 0.8, y2: 0.435 },
  { x1: 0.195, y1: 0.618, x2: 0.364, y2: 0.578 },
  { x1: 0.604, y1: 0.752, x2: 0.79, y2: 0.73 },
] as const;

export const CuttingMatSurface: React.FC<CuttingMatSurfaceProps> = ({
  active = true,
  children,
  className = '',
  density = 'auto',
  float = true,
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1100, h: 760 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const gradientId = useId().replace(/:/g, '');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const drifting = active && float && !reducedMotion;

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setDims(prev => (Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1)
          ? prev
          : { w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const { w, h } = dims;
    const compact = density === 'compact' || (density === 'auto' && w < 640);
    const unit = compact ? 16 : 22;
    const margin = compact ? 38 : 58;
    const cols = Math.max(10, Math.floor((w - margin * 2) / unit));
    const rows = Math.max(10, Math.floor((h - margin * 2) / unit));
    const x0 = Math.round((w - cols * unit) / 2);
    const y0 = Math.round((h - rows * unit) / 2);
    return {
      w, h, unit, cols, rows, x0, y0,
      x1: x0 + cols * unit,
      y1: y0 + rows * unit,
      xUnits: Array.from({ length: cols + 1 }, (_, i) => i),
      yUnits: Array.from({ length: rows + 1 }, (_, i) => i),
    };
  }, [density, dims]);

  const originX = geo.x0;
  const originY = geo.y1;
  const guideLength = Math.min(geo.x1 - geo.x0, geo.y1 - geo.y0) * 0.95;
  const fillId = `mat-fill-${gradientId}`;
  const lightId = `mat-light-${gradientId}`;

  return (
    <motion.div
      ref={surfaceRef}
      data-cutting-mat-surface=""
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={drifting
        ? { opacity: 1, scale: 1, y: [0, -6, 0], rotate: [-0.72, -0.38, -0.72] }
        : { opacity: 1, scale: 1, y: 0, rotate: -0.72 }}
      transition={drifting ? {
        opacity: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
        scale: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
        y: { duration: 0.5, ease: 'easeOut' },
        rotate: { duration: 0.5, ease: 'easeOut' },
      } : {
        opacity: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
        scale: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
        y: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
        rotate: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      className={`relative h-full w-full overflow-hidden rounded-[1.7rem] md:rounded-[2.15rem] ${className}`.trim()}
      style={{
        background: '#00332A',
        boxShadow: '0 44px 150px rgba(0, 0, 0, 0.62), 0 10px 42px rgba(207, 232, 84, 0.08), inset 0 -36px 70px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(245, 255, 178, 0.2)',
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${geo.w} ${geo.h}`}
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064a3c" />
            <stop offset="42%" stopColor="#00332A" />
            <stop offset="100%" stopColor="#01241f" />
          </linearGradient>
          <radialGradient id={lightId} cx="36%" cy="22%" r="72%">
            <stop offset="0%" stopColor="rgba(255,255,212,0.2)" />
            <stop offset="48%" stopColor="rgba(255,255,212,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,212,0)" />
          </radialGradient>
        </defs>

        <rect width={geo.w} height={geo.h} rx="34" fill={`url(#${fillId})`} />
        <rect width={geo.w} height={geo.h} rx="34" fill={`url(#${lightId})`} />
        <rect x="22" y="22" width={geo.w - 44} height={geo.h - 44} rx="27" fill="none" stroke="rgba(229,229,90,0.34)" strokeWidth="1.15" />
        <rect x="38" y="38" width={geo.w - 76} height={geo.h - 76} rx="19" fill="none" stroke="rgba(229,229,90,0.18)" strokeWidth="0.8" />

        <g>
          {geo.xUnits.map((unit) => {
            const x = geo.x0 + unit * geo.unit;
            const isMajor = unit % 5 === 0;
            return <line key={`mat-v-${unit}`} x1={x} y1={geo.y0} x2={x} y2={geo.y1} stroke={isMajor ? 'rgba(229,229,90,0.46)' : 'rgba(229,229,90,0.16)'} strokeWidth={isMajor ? 1 : 0.55} />;
          })}
          {geo.yUnits.map((unit) => {
            const y = geo.y0 + unit * geo.unit;
            const isMajor = unit % 5 === 0;
            return <line key={`mat-h-${unit}`} x1={geo.x0} y1={y} x2={geo.x1} y2={y} stroke={isMajor ? 'rgba(229,229,90,0.46)' : 'rgba(229,229,90,0.16)'} strokeWidth={isMajor ? 1 : 0.55} />;
          })}
        </g>

        <g stroke="rgba(229,229,90,0.38)" strokeLinecap="round">
          {geo.xUnits.map((unit) => {
            const x = geo.x0 + unit * geo.unit;
            const tick = unit % 5 === 0 ? 13 : 8;
            return (
              <React.Fragment key={`mat-x-tick-${unit}`}>
                <line x1={x} y1={geo.y0 - 22} x2={x} y2={geo.y0 - 22 + tick} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
                <line x1={x} y1={geo.y1 + 22} x2={x} y2={geo.y1 + 22 - tick} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
              </React.Fragment>
            );
          })}
          {geo.yUnits.map((unit) => {
            const y = geo.y0 + unit * geo.unit;
            const tick = unit % 5 === 0 ? 13 : 8;
            return (
              <React.Fragment key={`mat-y-tick-${unit}`}>
                <line x1={geo.x0 - 22} y1={y} x2={geo.x0 - 22 + tick} y2={y} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
                <line x1={geo.x1 + 22} y1={y} x2={geo.x1 + 22 - tick} y2={y} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
              </React.Fragment>
            );
          })}
        </g>

        <g fill="rgba(237,241,116,0.72)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9" fontWeight="700">
          {geo.xUnits.filter(unit => unit % 5 === 0).map((unit) => {
            const x = geo.x0 + unit * geo.unit;
            return (
              <React.Fragment key={`mat-x-label-${unit}`}>
                <text x={x} y={geo.y0 - 30} textAnchor="middle">{unit}</text>
                <text x={x} y={geo.y1 + 42} textAnchor="middle">{unit}</text>
              </React.Fragment>
            );
          })}
          {geo.yUnits.filter(unit => unit % 5 === 0).map((unit) => {
            const y = geo.y0 + unit * geo.unit + 3;
            return (
              <React.Fragment key={`mat-y-label-${unit}`}>
                <text x={geo.x0 - 32} y={y} textAnchor="middle">{unit}</text>
                <text x={geo.x1 + 32} y={y} textAnchor="middle">{unit}</text>
              </React.Fragment>
            );
          })}
        </g>

        <g stroke="rgba(229,229,90,0.34)" strokeWidth="0.85" strokeDasharray="3 5" fill="none">
          {matAngles.map((angle) => {
            const radians = angle * Math.PI / 180;
            const endX = originX + Math.cos(radians) * guideLength;
            const endY = originY - Math.sin(radians) * guideLength;
            const labelX = originX + Math.cos(radians) * 148;
            const labelY = originY - Math.sin(radians) * 148;
            return (
              <React.Fragment key={`mat-angle-${angle}`}>
                <line x1={originX} y1={originY} x2={endX} y2={endY} />
                <text x={labelX + 6} y={labelY - 6} fill="rgba(237,241,116,0.78)" stroke="none" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" fontWeight="700">
                  {angle}°
                </text>
              </React.Fragment>
            );
          })}
          {matRadii.filter(radius => radius <= guideLength).map(radius => (
            <path key={`mat-radius-${radius}`} d={`M ${originX + radius} ${originY} A ${radius} ${radius} 0 0 0 ${originX} ${originY - radius}`} stroke="rgba(229,229,90,0.28)" strokeDasharray="none" />
          ))}
        </g>

        <g stroke="rgba(0,0,0,0.28)" strokeWidth="1" strokeLinecap="round">
          {matCutMarks.map((mark, index) => (
            <line key={`mat-cut-${index}`} x1={geo.x0 + mark.x1 * (geo.x1 - geo.x0)} y1={geo.y0 + mark.y1 * (geo.y1 - geo.y0)} x2={geo.x0 + mark.x2 * (geo.x1 - geo.x0)} y2={geo.y0 + mark.y2 * (geo.y1 - geo.y0)} />
          ))}
        </g>

        <g fill="rgba(237,241,116,0.62)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="800" letterSpacing="3">
          <text x={geo.x0 + 6} y={geo.y1 - 20} fontSize="10">SELF-HEALING CUTTING MAT</text>
          <text x={geo.x0 + 6} y={geo.y1 - 2} fontSize="8" fill="rgba(237,241,116,0.46)">A2 GRID / 10 MM / 15-60 DEGREE GUIDES</text>
          <text x={geo.x1 - 20} y={geo.y0 + 25} fontSize="8" textAnchor="end" fill="rgba(237,241,116,0.46)">ADI AGARWAL / WORKSHOP GRID</text>
        </g>
      </svg>

      <div aria-hidden="true" className="absolute inset-0 rounded-[1.7rem] opacity-40 mix-blend-soft-light md:rounded-[2.15rem]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 0.65px, transparent 0.65px)', backgroundSize: '5px 5px' }} />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[32%] bg-gradient-to-b from-black/28 via-black/8 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/34 via-black/10 to-transparent" />
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[16%] bg-gradient-to-r from-black/22 via-black/8 to-transparent" />
      <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[16%] bg-gradient-to-l from-black/22 via-black/8 to-transparent" />
      <div aria-hidden="true" className="absolute left-1/2 top-[51%] h-[50%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#001c18]/40 blur-3xl" />
      {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </motion.div>
  );
};

export default CuttingMatSurface;
