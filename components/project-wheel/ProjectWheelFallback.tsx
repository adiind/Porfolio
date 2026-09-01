import React from 'react';
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
      return { translateX: 0, translateY: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 5 };
    case -1:
      return { translateX: -72, translateY: -58, rotate: -8, scale: 0.68, opacity: 0.66, zIndex: 3 };
    case 1:
      return { translateX: 70, translateY: 65, rotate: 8, scale: 0.68, opacity: 0.66, zIndex: 3 };
    case -2:
      return { translateX: -108, translateY: 95, rotate: -13, scale: 0.48, opacity: 0.3, zIndex: 2 };
    case 2:
      return { translateX: 103, translateY: -75, rotate: 13, scale: 0.48, opacity: 0.3, zIndex: 2 };
    default:
      return { translateX: 0, translateY: 0, rotate: 0, scale: 0.4, opacity: 0, zIndex: 1 };
  }
};

const ProjectWheelFallback: React.FC<Props> = ({ items, activeIndex, onSelect, onOpen }) => (
  <div data-project-wheel-fallback className="absolute inset-0 overflow-hidden" aria-hidden="true">
    <svg
      data-project-wheel-links
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <path d="M 8 68 C 19 56, 27 42, 52 46 S 76 64, 94 29" fill="none" stroke="rgba(229,229,90,0.38)" strokeWidth="0.32" strokeDasharray="1.2 1.4" />
      <path d="M 23 33 C 34 40, 40 45, 52 46 S 67 54, 81 61" fill="none" stroke="rgba(229,229,90,0.62)" strokeWidth="0.48" />
      <circle cx="52" cy="46" r="1.25" fill="#E5E55A" opacity="0.84" />
      <circle cx="23" cy="33" r="0.65" fill="#E5E55A" opacity="0.55" />
      <circle cx="81" cy="61" r="0.65" fill="#E5E55A" opacity="0.55" />
    </svg>
    {items.map((item, index) => {
      const offset = relativeIndex(index, activeIndex, items.length);
      const isActive = offset === 0;
      const layout = layoutFor(offset);
      return (
        <button
          key={item.id}
          type="button"
          tabIndex={-1}
          onClick={() => isActive ? onOpen(index) : onSelect(index)}
          className="absolute left-1/2 top-1/2 aspect-[3/2] w-[56%] min-w-[180px] max-w-[340px] overflow-hidden rounded-2xl border text-left shadow-[0_22px_55px_rgba(0,0,0,0.58)]"
          style={{
            opacity: layout.opacity,
            zIndex: layout.zIndex,
            transform: `translate(-50%, -50%) translate(${layout.translateX}%, ${layout.translateY}%) rotate(${layout.rotate}deg) scale(${layout.scale})`,
            borderColor: isActive ? 'rgba(229,229,90,0.86)' : 'rgba(255,255,255,0.24)',
            transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 160ms ease',
            willChange: 'transform, opacity',
          }}
        >
          <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pb-3 pt-10 text-xs font-semibold text-white">
            {item.title}
          </span>
        </button>
      );
    })}
  </div>
);

export default ProjectWheelFallback;
