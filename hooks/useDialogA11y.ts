import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function useDialogA11y(onClose: () => void, options?: { historyTag?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    container?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();               // state-based close — never via history
        return;
      }
      if (e.key === 'Tab' && container) {   // focus trap
        const els = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)]
          .filter(el => el.offsetParent !== null || el === document.activeElement);
        if (!els.length) { e.preventDefault(); container.focus(); return; }
        const first = els[0], last = els[els.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === container)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (active === last || active === container)) { e.preventDefault(); first.focus(); }
        else if (!container.contains(active)) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    // Browser-back closes the dialog; the dialog never depends on history to close.
    const tag = options?.historyTag;
    let consumed = false;         // our pushed entry has been popped (by us or the user)
    let selfPopping = false;      // the next popstate is our own history.back(), not a user gesture
    const handlePopState = () => {
      if (selfPopping) { selfPopping = false; return; }
      if (consumed) return;
      consumed = true;
      onCloseRef.current();
    };
    if (tag) {
      window.history.pushState({ modal: tag }, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (tag) {
        if (!consumed && window.history.state?.modal === tag) {
          consumed = true;
          selfPopping = true;
          window.history.back(); // consume the entry we pushed
        }
        window.removeEventListener('popstate', handlePopState);
      }
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return containerRef;
}
