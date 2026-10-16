// Squad Up: finish a scroll that stops between two scenes of a pinned stretch, and say there is more to scroll.
(() => {
  if (!window.ScrollSettle || !window.ScrollTrigger) return;
  const END = 6.6, intro = 'squad-intro', story = 'squad-story';
  const BEATS = [0, 1.25, 2.25, 3.27, 3.82, 4.37, 4.92, 5.47, 6.02, END];  // opening, the four match-cuts, the six app screens, the end of the pin
  const at = (st, f) => st.start + f * (st.end - st.start);
  const rests = () => {
    const list = [];
    const a = ScrollTrigger.getById(intro), b = ScrollTrigger.getById(story);
    if (a) BEATS.forEach((u) => list.push({ y: at(a, u / END), strong: true, g: 'intro' }));
    if (b && b.end > b.start) { const n = document.querySelectorAll('.storyboard-strip > li').length || 8; for (let k = 0; k < n; k++) list.push({ y: at(b, k / (n - 1)), strong: true, g: 'story' }); }
    document.querySelectorAll('.ph').forEach((el) => { if (el.getClientRects().length) list.push({ y: el.getBoundingClientRect().top + scrollY - 56 }); });
    return list;
  };
  window.__rests = rests;
  const setScroll = (y) => (window.lenis ? window.lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo({ top: y, behavior: 'instant' }));
  const root = document.documentElement;
  const engine = ScrollSettle.init({ rests, setScroll, enabled: () => !root.classList.contains('no-motion') && !document.querySelector('dialog[open]') });
  const total = () => Math.max(1, root.scrollHeight - innerHeight);
  ScrollSettle.pill({
    label: 'Keep scrolling',
    show: () => scrollY > 120 && scrollY < total() - innerHeight * 0.6,   // the first screen has its own cue; the end has the Explore button
    progress: () => scrollY / total(),
    onClick: engine.advance,
  });
})();
