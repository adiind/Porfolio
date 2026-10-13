// Every view shares the same frame and aperture. Enlarge uses the same source, without a redraw.
(() => {
  const dialog = document.getElementById('screenDialog');
  const screen = document.getElementById('detailScreen');
  const title = document.getElementById('screenDialogTitle');
  let trigger;
  const caps = () => document.documentElement.style.setProperty('--clay-phone-cap', `${823 / Math.max(1, devicePixelRatio)}px`);
  caps();
  addEventListener('resize', caps, { passive: true });
  function fit(display) {
    const img = display.querySelector('.clay-ui');
    const w = img.naturalWidth || Number(img.getAttribute('width'));
    const h = img.naturalHeight || Number(img.getAttribute('height'));
    if (!w || !h || !display.clientWidth) return;
    const scale = Math.min(display.clientWidth * .96 / w, display.clientHeight * .96 / h, 1 / Math.max(1, devicePixelRatio));
    img.style.width = `${w * scale}px`;
    img.style.height = `${h * scale}px`;
  }
  const observer = new ResizeObserver(entries => entries.forEach(entry => fit(entry.target)));
  document.querySelectorAll('.clay-display').forEach(display => {
    observer.observe(display);
    display.querySelector('img').addEventListener('load', () => fit(display));
    fit(display);
  });
  const open = (img, label, button) => {
    trigger = button;
    screen.src = img.src;
    screen.width = img.naturalWidth || img.width;
    screen.height = img.naturalHeight || img.height;
    screen.alt = `${label}: original Squad Up Figma interface.`;
    dialog.querySelector('.clay-phone').style.maxWidth = Math.min(823 / devicePixelRatio, (img.naturalWidth || img.width) / .70231 / devicePixelRatio) + 'px';
    title.textContent = label;
    dialog.showModal();
    requestAnimationFrame(() => fit(dialog.querySelector('.clay-display')));
  };
  document.querySelectorAll('.app-preview').forEach(button => button.addEventListener('click', () => open(button.querySelector('.clay-ui'), button.dataset.screen.replace(/^./, c => c.toUpperCase()), button)));
  document.querySelectorAll('.flow-state').forEach((state, i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'flow-enlarge'; button.textContent = 'Enlarge this screen ↗';
    button.addEventListener('click', () => open(document.getElementById('flowScreen'), ['Invite','Join','Choose','Pay','Readiness','Pickup'][i], button));
    state.append(button);
  });
  document.getElementById('screenDialogClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
})();
