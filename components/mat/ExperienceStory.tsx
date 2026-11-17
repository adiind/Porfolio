import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { EXPERIENCE_STORIES, type ExperienceId } from './experienceStories';
import './experience-story.css';
import { STORY_ILLUSTRATIONS } from '../../lib/mat/storyIllustrations';

type Props = { id: ExperienceId | null; onClose(): void };
const FIGURES: Record<string, string[]> = {
  supply: ['SKU availability', 'Vendor performance', 'Procurement'], scale: ['FMCG', 'Pharma', 'Food'],
  wondermart: ['Funnel', 'Retention', 'Product decisions'], percept: ['Dashboards', 'Onboarding', 'Self-serve'],
  home: ['Homepage', 'Search', 'Ranking'], friends: ['Friends', 'Recommendations', 'Ordering'], rescue: ['Cancelled meal', 'Nearby customer', 'Rescued'],
  'schmooze:role': ['Product', 'Growth', 'Behavior'], 'self:role': ['Direction', 'Testing', 'Workflows'], 'snapdeal:role': ['Data', 'Analysis', 'Finance'], dashboards: ['Creator management', 'V0 dashboards'], testing: ['Sessions', 'Experiments', 'Learning'],
  vault: ['Agent', 'Checkout'], protect: ['Stand-in', 'Enclave', 'Checkout'], deleteme: ['Self', 'DeleteMe'],
  ads: ['CPC', 'Transaction', 'Banners'], result: ['Seller ads', 'Experiments'], warehouse: ['Warehouse', 'Inventory', 'Procurement'],
};
export default function ExperienceStory({ id, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (id && !node.open) { previous.current = document.activeElement as HTMLElement; node.showModal(); close.current?.focus(); }
    if (!id && node.open) { node.close(); previous.current?.focus(); }
  }, [id]);
  const story = id ? EXPERIENCE_STORIES[id] : null;
  // (pointerEvents: on the 3D home it is mounted in the second screen's port, which lets clicks through to the mat
  // (flipbook.css .fb-second-port, pointer-events: none); the open story must take them, or its close button is dead)
  return <dialog ref={dialog} className="experience-story" style={{ pointerEvents: 'auto' }} aria-labelledby="experience-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    {story && <div className={`experience-board experience-${id}`}>
      <header className="experience-header"><button ref={close} type="button" className="fb-pill fb-pill--back" onClick={onClose}><ArrowLeft size={16} aria-hidden="true" /><span>Back</span></button><div><span>EXPERIENCE</span><h2 id="experience-title">{story.title}</h2><p>{story.role}</p></div></header>
      <div className="experience-cards" role="region" tabIndex={0} aria-label={`${story.title} story cards`}>
        {story.cards.map((card, index) => <article className="experience-card" key={card.id} data-card={card.id}>
          <p className="experience-kicker">{card.kicker}</p>
          {id && id in STORY_ILLUSTRATIONS ? <div className={`experience-figure experience-illustration illustration-${index}`} style={{ backgroundImage: `url(${STORY_ILLUSTRATIONS[id as keyof typeof STORY_ILLUSTRATIONS]})` }} role="img" aria-label="AI-generated conceptual illustration"><small>AI illustration</small></div> : <div className="experience-figure" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><div>{(FIGURES[`${id}:${card.id}`] ?? FIGURES[card.id] ?? [story.title]).map((label) => <b key={label}>{label}</b>)}</div></div>}
          <h3>{card.title}</h3><div className="experience-copy">{card.lines.map((line) => <p key={line}>{line}</p>)}</div>
          {id === 'self' && card.id === 'vault' && <a href="https://agentvault.io/" target="_blank" rel="noopener noreferrer">Visit Agent Vault ↗</a>}
          <footer>{story.title}</footer>
        </article>)}
      </div>
      <p className="experience-hint">Scroll to see the cards</p>
    </div>}
  </dialog>;
}
