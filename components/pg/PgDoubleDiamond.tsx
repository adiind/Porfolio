import React, { useRef } from 'react';
import { pgVisitEvents } from '../../data/pgStory';
import PgThread from './PgThread';

const PgDoubleDiamond: React.FC = () => {
  const sheetRef = useRef<HTMLDivElement>(null);
  return <div className="pg-sprint-sheet"><div className="pg-settings"><span>Discover & define · At home</span><span>Develop & deliver · Central site</span></div><div ref={sheetRef} className="pg-journey-list" aria-label="Sprint process">
    <PgThread rootRef={sheetRef} />
    {pgVisitEvents.map(event => <article key={event.id} className={`pg-journey-stop ${event.diamond === 'develop-deliver' ? 'pg-journey-studio' : ''}`}>
      <figure className="pg-room"><img src={`/images/pg/rooms/room-${event.id}.webp`} alt={`Illustrated miniature ${event.setting === 'In-home' ? 'home' : 'studio'} setting for ${event.label}; not field documentation.`} width={720} height={720} loading="lazy" /></figure>
      <div className="pg-visit-line"><span data-pg-visit-port className="pg-visit-diamond" aria-hidden="true" /></div>
      <div className="pg-journey-copy"><p className="pg-journey-phase">{event.phase}</p><h3>{event.label}</h3><p className="pg-journey-setting">{event.setting}</p><p className="pg-journey-detail">{event.detail}</p></div>
    </article>)}
  </div><p className="pg-illustration-label">Illustrated settings · the process shown is high-level; research details are withheld.</p></div>;
};
export default PgDoubleDiamond;
