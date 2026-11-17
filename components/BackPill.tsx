import React from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * The one way out of every page and overlay: a dark "Back" pill at the top left.
 * Same look as the 3D home's `.fb-pill--back` (components/flipbook/flipbook.css): #0b0e16, white text,
 * 44px tall, top 18px / left 22px; on phones top 12px / left 16px.
 * The same values are repeated where a page cannot use this component: .back (zero/muse story CSS),
 * .back-link (familysync.css), .pg-close (components/pg/pg-case.css), .world-back (components/worlds/worlds.css).
 */
export const BACK_PILL_CLASS =
    'inline-flex items-center gap-2 min-h-[44px] px-[18px] rounded-full border-0 bg-[#0b0e16] text-white text-[14px] font-semibold leading-none whitespace-nowrap cursor-pointer no-underline '
    + 'shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_8px_18px_-10px_rgba(0,0,0,0.6)] transition-transform duration-150 hover:-translate-y-px '
    + 'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#fff,0_0_0_5px_#0b0e16]';

export const BACK_PILL_POSITION = 'fixed left-4 top-3 sm:left-[22px] sm:top-[18px]';

interface Props {
    onClick: () => void;
    ariaLabel?: string;
    label?: string;
    /** Render into document.body (for overlays whose own box is transformed or clipped). */
    portal?: boolean;
    /** Render into this element instead (keeps the pill in the page's own stacking order). */
    portalTarget?: HTMLElement | null;
    /** Stacking order; defaults above the page's overlays. */
    zClass?: string;
    className?: string;
}

const BackPill: React.FC<Props> = ({ onClick, ariaLabel, label = 'Back', portal = false, portalTarget, zClass = 'z-[9999]', className = '' }) => {
    const button = (
        <button
            type="button"
            data-back-pill
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            aria-label={ariaLabel}
            className={`${BACK_PILL_POSITION} ${zClass} ${BACK_PILL_CLASS} ${className}`}
            style={{ fontFamily: 'inherit' }}
        >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{label}</span>
        </button>
    );
    if (portalTarget) return ReactDOM.createPortal(button, portalTarget);
    return portal ? ReactDOM.createPortal(button, document.body) : button;
};

export default BackPill;
