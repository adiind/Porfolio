// FamilySync: finish a scroll that stops between two states of a pinned scene, and say there is more to scroll.
(() => {
  if (!window.ScrollSettle) return;
  const root = document.documentElement;
  const doc = (el) => el.getBoundingClientRect().top + scrollY;
  const scene = document.querySelector('.scene'), climax = document.querySelector('[data-climax]');
  // Fractions of each pinned stretch where the picture is settled (scene: calendar open, closed, contacting; climax: the stage builds).
  const SCENE = [0, 0.3, 0.68, 0.9, 1], CLIMAX = [0.07, 0.22, 0.39, 0.57, 0.78, 1];
  const rests = () => {
    const list = [];
    if (scene) SCENE.forEach((p) => list.push({ y: doc(scene) + p * (scene.offsetHeight - innerHeight), strong: true, g: 'scene' }));
    if (climax) CLIMAX.forEach((p) => list.push({ y: doc(climax) + p * (climax.offsetHeight - innerHeight), strong: true, g: 'climax' }));
    document.querySelectorAll('[data-step]').forEach((el) => { if (el !== scene && el !== climax) list.push({ y: doc(el) - 8 }); });
    return list;
  };
  window.__rests = rests;
  const engine = ScrollSettle.init({ rests, enabled: () => !root.classList.contains('still') });
  root.style.setProperty('--ss-bg', '#0d1b33'); root.style.setProperty('--ss-accent', '#3e76c2'); root.style.setProperty('--ss-font', '"Geist", system-ui, sans-serif'); root.style.setProperty('--ss-lift', '76px');
  const total = () => Math.max(1, root.scrollHeight - innerHeight);
  ScrollSettle.pill({
    progress: () => scrollY / total(),
    show: () => scrollY > 120 && scrollY < total() - innerHeight * 0.5,
    onClick: engine.advance,
  });
})();
