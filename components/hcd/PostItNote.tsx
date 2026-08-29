import React from 'react';
import { HcdPostIt } from './types';

const toneClass: Record<HcdPostIt['tone'], string> = {
  yellow: 'bg-[#f6e68b] text-[#292510]',
  blue: 'bg-[#b9dced] text-[#14252d]',
  green: 'bg-[#bdd9b2] text-[#142516]',
  cream: 'bg-[#f2dfbd] text-[#2c2114]',
  red: 'bg-[#efa7a0] text-[#351411]',
};

export const PostItNote: React.FC<{ note: HcdPostIt }> = ({ note }) => (
  <aside
    data-hcd-post-it={note.id}
    className={`hcd-post-it relative inline-flex aspect-square w-[clamp(9.25rem,26vw,11.5rem)] shrink-0 items-start overflow-hidden p-4 text-[14px] font-semibold leading-[1.32] shadow-[0_12px_26px_rgba(0,0,0,0.28)] ${toneClass[note.tone]}`}
    style={{ transform: `rotate(${note.rotation}deg)` }}
  >
    <span className="relative z-10">{note.text}</span>
  </aside>
);

export default PostItNote;
