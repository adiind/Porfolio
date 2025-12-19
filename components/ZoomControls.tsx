import React from 'react';
import { Plus, Minus, Maximize, Minimize } from 'lucide-react';
import { TimelineMode } from '../types';

interface ZoomControlsProps {
  mode: TimelineMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetZoom: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  mode,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetZoom,
}) => {
  return (
    <div className="absolute top-24 right-6 flex flex-col gap-2 z-40">
      <button 
        onClick={onZoomIn}
        className="p-2 rounded-full border transition-all bg-black/40 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
        title="Zoom In"
      >
        <Plus size={16} />
      </button>
      <button 
        onClick={onZoomOut}
        className="p-2 rounded-full border transition-all bg-black/40 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
        title="Zoom Out"
      >
        <Minus size={16} />
      </button>
      <div className="w-full h-[1px] bg-white/10 my-1" />
      {mode !== 'fit' ? (
        <button 
          onClick={onFitToScreen}
          className="p-2 rounded-full border transition-all bg-indigo-500/20 text-indigo-200 border-indigo-500/50 hover:bg-indigo-500/40"
          title="Fit to Screen"
        >
          <Minimize size={16} />
        </button>
      ) : (
        <button 
          onClick={onResetZoom}
          className="p-2 rounded-full border transition-all bg-indigo-500 text-white border-indigo-500"
          title="Reset Zoom"
        >
          <Maximize size={16} />
        </button>
      )}
    </div>
  );
};

export default ZoomControls;

