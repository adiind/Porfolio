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

const ProjectWheelFallback: React.FC<Props> = ({ items, activeIndex, onSelect, onOpen }) => (
  <div data-project-wheel-fallback className="absolute inset-0 overflow-hidden" aria-hidden="true">
    {items.map((item, index) => {
      const offset = relativeIndex(index, activeIndex, items.length);
      const visible = Math.abs(offset) <= 2;
      const isActive = offset === 0;
      return (
        <button
          key={item.id}
          type="button"
          tabIndex={-1}
          onClick={() => isActive ? onOpen(index) : onSelect(index)}
          className="absolute left-[62%] top-1/2 aspect-[3/2] w-[42%] max-w-[220px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border text-left shadow-[0_22px_55px_rgba(0,0,0,0.58)]"
          style={{
            opacity: visible ? (isActive ? 1 : 0.48) : 0,
            zIndex: 10 - Math.abs(offset),
            transform: `translate(-50%, calc(-50% + ${offset * 112}px)) rotate(${offset * 7}deg) scale(${isActive ? 1 : 0.82})`,
            borderColor: isActive ? 'rgba(229,229,90,0.86)' : 'rgba(255,255,255,0.24)',
            transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, border-color 200ms ease',
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
