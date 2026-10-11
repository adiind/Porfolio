import React, { useEffect, useState } from 'react';

// A single page-drawn thread follows measured visit markers after responsive reflow.
const PgThread: React.FC<{ rootRef: React.RefObject<HTMLDivElement | null> }> = ({ rootRef }) => {
  const [drawing, setDrawing] = useState({ width: 1, height: 1, path: '' });
  useEffect(() => {
    const root = rootRef.current as HTMLDivElement | null;
    if (!root) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      const bounds = root.getBoundingClientRect();
      const rows = Array.from(root.querySelectorAll<HTMLElement>('.pg-journey-stop'));
      const points = Array.from(root.querySelectorAll<HTMLElement>('[data-pg-visit-port]')).map(marker => {
        const box = marker.getBoundingClientRect();
        return { x: box.left - bounds.left + box.width / 2, y: box.top - bounds.top + box.height / 2 };
      });
      let path = '';
      points.forEach((point, i) => {
        if (!i) { path = `M 2 ${point.y} L ${point.x} ${point.y}`; return; }
        const previous = points[i - 1];
        if (Math.abs(previous.y - point.y) < 4) path += ` L ${point.x} ${point.y}`;
        else {
          const bottom = Math.max(...rows.slice(0, i).map(row => row.getBoundingClientRect().bottom - bounds.top));
          const edge = (bottom + point.y) / 2;
          const radius = Math.min(8, Math.max(2, (point.y - bottom) / 4));
          path += ` L ${bounds.width - 3} ${previous.y} L ${bounds.width - 3} ${edge - radius} Q ${bounds.width - 3} ${edge} ${bounds.width - 3 - radius} ${edge} L ${3 + radius} ${edge} Q 3 ${edge} 3 ${edge + radius} L 3 ${point.y} L ${point.x} ${point.y}`;
        }
      });
      if (points.length) path += ` L ${bounds.width - 2} ${points.at(-1)!.y}`;
      setDrawing({ width: bounds.width, height: root.offsetHeight, path });
    };
    const schedule = () => { if (disposed) return; cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    root.querySelectorAll('.pg-journey-stop').forEach(element => observer.observe(element));
    document.fonts.ready.then(schedule);
    schedule();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [rootRef]);
  return <svg className="pg-continuous-thread" aria-hidden="true" width={drawing.width} height={drawing.height} viewBox={`0 0 ${drawing.width} ${drawing.height}`}><path d={drawing.path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};
export default PgThread;
