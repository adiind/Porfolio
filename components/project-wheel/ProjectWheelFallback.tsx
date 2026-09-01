import React from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProjectWheelItem } from './projectWheelTypes';

interface Props {
  items: ProjectWheelItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
}

const relativeIndex = (index: number, activeIndex: number, count: number) => {
  let difference = index - activeIndex;
  if (difference > count / 2) difference -= count;
  if (difference < -count / 2) difference += count;
  return difference;
};

const layoutFor = (offset: number) => {
  switch (offset) {
    case 0:
      return { translateX: 15, translateY: -25, rotate: 0, scale: 1, opacity: 1, zIndex: 5 };
    case -1:
      return { translateX: -48, translateY: -10, rotate: -6, scale: 0.6, opacity: 0.58, zIndex: 3 };
    case 1:
      return { translateX: 40, translateY: 43, rotate: 6, scale: 0.6, opacity: 0.58, zIndex: 3 };
    default:
      return { translateX: 15, translateY: -25, rotate: 0, scale: 0.42, opacity: 0, zIndex: 1 };
  }
};

const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;

const ProjectWheelFallback: React.FC<Props> = ({ items, activeIndex, onSelect, onOpen }) => {
  const activeProject = items[activeIndex] ?? items[0];
  const previousIndex = wrapIndex(activeIndex - 1, items.length);
  const nextIndex = wrapIndex(activeIndex + 1, items.length);

  return (
    <div data-project-wheel-fallback className="absolute inset-0">
      <div data-project-wheel-stage className="relative h-full w-full">
        <div className="pointer-events-none absolute right-0 top-4 font-mono text-[8px] uppercase tracking-[0.24em] text-[#E5E55A]/58">
          Selected work / rotate
        </div>

        <svg
          data-project-wheel-links
          viewBox="0 0 380 430"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <path
            d="M 34 202 C 92 143, 156 134, 235 168 C 302 196, 329 238, 314 288"
            fill="none"
            stroke="rgba(229,229,90,0.56)"
            strokeWidth="1.3"
          />
          <path
            d="M 34 202 C 92 143, 156 134, 235 168 C 302 196, 329 238, 314 288"
            fill="none"
            stroke="rgba(229,229,90,0.28)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="34" cy="202" r="3" fill="#E5E55A" opacity="0.7" />
          <circle cx="235" cy="168" r="4" fill="#E5E55A" />
          <circle cx="314" cy="288" r="3" fill="#E5E55A" opacity="0.7" />
        </svg>

        {items.map((item, index) => {
          const offset = relativeIndex(index, activeIndex, items.length);
          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 1;
          const layout = layoutFor(offset);

          return (
            <button
              key={item.id}
              type="button"
              data-project-wheel-card={isActive ? 'active' : 'neighbor'}
              data-visible={isVisible ? 'true' : 'false'}
              tabIndex={isVisible ? 0 : -1}
              aria-label={isActive ? `Open ${item.title}` : `Show ${item.title}`}
              onClick={() => isActive ? onOpen(index) : onSelect(index)}
              className="group absolute left-1/2 top-1/2 aspect-[8/5] w-[284px] overflow-hidden rounded-[1.15rem] border bg-[#071714] text-left shadow-[0_24px_64px_rgba(0,0,0,0.56)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
              style={{
                opacity: layout.opacity,
                zIndex: layout.zIndex,
                pointerEvents: isVisible ? 'auto' : 'none',
                transform: `translate(-50%, -50%) translate(${layout.translateX}%, ${layout.translateY}%) rotate(${layout.rotate}deg) scale(${layout.scale})`,
                borderColor: isActive ? 'rgba(229,229,90,0.9)' : 'rgba(255,255,255,0.28)',
                transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 160ms ease',
                willChange: 'transform, opacity',
              }}
            >
              <img
                src={item.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/10 to-black/5" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-3 pt-9 text-[11px] font-semibold leading-tight text-white">
                <span className="line-clamp-2">{item.title}</span>
                {isActive && <ArrowUpRight size={14} className="mb-0.5 shrink-0 text-[#E5E55A]" aria-hidden="true" />}
              </span>
            </button>
          );
        })}

        <div
          data-project-wheel-summary
          className="absolute inset-x-0 bottom-0 z-10 rounded-[1.35rem] border border-white/18 bg-[#04110f]/94 p-3.5 shadow-[0_22px_60px_rgba(0,0,0,0.48)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[0.18em] text-white/52">
            <span>{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
            <span>{activeProject.status}</span>
          </div>
          <div aria-live="polite" className="mt-1.5 pr-20">
            <h2 className="text-base font-semibold leading-tight text-white">{activeProject.title}</h2>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/62">{activeProject.oneLiner}</p>
          </div>
          <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelect(previousIndex)}
              aria-label="Previous project"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/18 bg-white/[0.05] text-white/72 transition-colors hover:border-white/38 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onSelect(nextIndex)}
              aria-label="Next project"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/18 bg-white/[0.05] text-white/72 transition-colors hover:border-white/38 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onOpen(activeIndex)}
              aria-label={`Open ${activeProject.title}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E55A] text-[#101500] transition-colors hover:bg-[#f0f570] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWheelFallback;
