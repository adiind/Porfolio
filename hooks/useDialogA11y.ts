import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export interface DialogHistoryOptions {
  historyTag: string;
  historyPath?: string;
  historyBasePath?: string;
  childHistoryTags?: readonly string[];
}

/** The part of `window` the dialog history protocol touches. */
export interface HistoryWindow {
  history: Pick<History, 'state' | 'pushState' | 'replaceState' | 'back'>;
  location: Pick<Location, 'pathname' | 'href'>;
  addEventListener(type: 'popstate', listener: () => void): void;
  removeEventListener(type: 'popstate', listener: () => void): void;
  setTimeout(handler: () => void, timeout: number): number;
  clearTimeout(id: number): void;
}

/**
 * Browser Back closes the dialog: the dialog owns one history entry while open and gives it back on close.
 * Every ordering rule in here is checked by hooks/dialogHistory.test.ts (.claude/skills/verify-dialog-history).
 */
export function bindDialogHistory(win: HistoryWindow, options: DialogHistoryOptions, onClose: () => void): () => void {
  const { historyTag: tag, historyPath, historyBasePath, childHistoryTags } = options;
  let consumed = false;
  let pushed = false;
  const handlePopState = () => {
    if (win.history.state?.modal === tag || childHistoryTags?.includes(win.history.state?.modal)) return;
    if (consumed) return;
    consumed = true;
    onClose();
  };
  win.addEventListener('popstate', handlePopState);
  const pushTimer = win.setTimeout(() => {
    pushed = true;
    if (historyPath && win.history.state?.modal === tag && win.location.pathname === historyPath) return;
    if (historyBasePath && historyPath
      && win.location.pathname.replace(/\/$/, '') === historyPath
      && win.history.state?.modal !== tag) {
      win.history.replaceState(null, '', historyBasePath);
    }
    win.history.pushState({ modal: tag }, '', historyPath ?? win.location.href);
  }, 0);

  return () => {
    win.removeEventListener('popstate', handlePopState);
    win.clearTimeout(pushTimer);
    if (pushed && !consumed && win.history.state?.modal === tag) {
      consumed = true;
      win.history.back();
    }
  };
}

export function useDialogA11y(onClose: () => void, options?: Partial<DialogHistoryOptions> & {
  escapePassthroughSelector?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    container?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let a focused inline control consume Escape before closing its dialog.
        if (options?.escapePassthroughSelector && e.target instanceof Element
          && e.target.closest(options.escapePassthroughSelector)) return;
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && container) {
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

    const tag = options?.historyTag;
    const unbindHistory = tag ? bindDialogHistory(window, { ...options, historyTag: tag }, () => onCloseRef.current()) : undefined;

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      unbindHistory?.();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return containerRef;
}
