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
      return { x: 52, y: 46, rotate: 0, scale: 1, opacity: 1, zIndex: 5 };
    case -1:
      return { x: 23, y: 33, rotate: -8, scale: 0.68, opacity: 0.66, zIndex: 3 };
    case 1:
      return { x: 81, y: 61, rotate: 8, scale: 0.68, opacity: 0.66, zIndex: 3 };
    case -2:
      return { x: 8, y: 68, rotate: -13, scale: 0.48, opacity: 0.3, zIndex: 2 };
    case 2:
      return { x: 94, y: 29, rotate: 13, scale: 0.48, opacity: 0.3, zIndex: 2 };
    default:
      return { x: 52, y: 46, rotate: 0, scale: 0.4, opacity: 0, zIndex: 1 };
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
          className="absolute aspect-[3/2] w-[56%] min-w-[180px] max-w-[340px] overflow-hidden rounded-2xl border text-left shadow-[0_22px_55px_rgba(0,0,0,0.58)]"
          style={{
            left: `${layout.x}%`,
            top: `${layout.y}%`,
            opacity: layout.opacity,
            zIndex: layout.zIndex,
            transform: `translate(-50%, -50%) rotate(${layout.rotate}deg) scale(${layout.scale})`,
            borderColor: isActive ? 'rgba(229,229,90,0.86)' : 'rgba(255,255,255,0.24)',
            transition: 'left 420ms cubic-bezier(0.22, 1, 0.36, 1), top 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, border-color 240ms ease',
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
