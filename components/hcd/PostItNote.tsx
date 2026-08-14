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
    className={`hcd-post-it relative min-h-36 p-5 text-[15px] font-semibold leading-snug shadow-[0_12px_24px_rgba(24,20,10,0.22)] ${toneClass[note.tone]}`}
    style={{ transform: `rotate(${note.rotation}deg)` }}
  >
    <span className="relative z-10">{note.text}</span>
  </aside>
);

export default PostItNote;
