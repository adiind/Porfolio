import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function useDialogA11y(onClose: () => void, options?: { historyTag?: string; historyPath?: string }) {
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
    const handlePopState = () => {
      // A pop that leaves our own entry on top is not a user "close" gesture:
      // it's either a StrictMode twin consuming its duplicate entry (dev double-
      // invoke pushes two identical entries, then its cleanup back() pops one),
      // or a nested child dialog consuming its entry above ours. Flag-based
      // suppression can't cover these because the back() is issued by a
      // different effect instance than the one that hears the popstate.
      if (window.history.state?.modal === tag) return;
      if (consumed) return;
      consumed = true;
      onCloseRef.current();
    };
    let pushTimer = 0;
    let pushed = false;
    if (tag) {
      window.addEventListener('popstate', handlePopState);
      // The push is deferred one tick because StrictMode mounts effects twice:
      // a synchronous push would make the twin's cleanup issue a back() whose
      // target entry the browser resolves AT CALL TIME, so it blows past the
      // remount's re-push and lands on the pre-dialog entry — read as a user
      // Back, insta-closing the dialog. Deferring lets the twin's cleanup
      // cancel the push before it ever touches the history stack.
      // historyPath gives the dialog a shareable URL (e.g. /work/<id>) on the
      // same entry the tag mechanism owns; back()/popstate restore the prior URL.
      pushTimer = window.setTimeout(() => {
        pushed = true;
        window.history.pushState({ modal: tag }, '', options?.historyPath ?? window.location.href);
      }, 0);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (tag) {
        // Remove the listener before consuming our entry so our own back()
        // can't be misread; other dialogs' listeners ignore it via the
        // state-tag check above.
        window.removeEventListener('popstate', handlePopState);
        window.clearTimeout(pushTimer);
        if (pushed && !consumed && window.history.state?.modal === tag) {
          consumed = true;
          window.history.back(); // consume the entry we pushed
        }
      }
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return containerRef;
}
