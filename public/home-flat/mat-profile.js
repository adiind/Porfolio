/* Profile content matches the classic portfolio; the portrait opens it on the narrow mat. */
(function () {
  var button = document.querySelector('.bx-me');
  if (!button) return;
  var dialog = document.createElement('dialog');
  dialog.className = 'mat-profile-dialog';
  dialog.setAttribute('aria-labelledby', 'mat-mobile-profile-title');
  dialog.innerHTML = '<article><header><button type="button" class="profile-back" aria-label="Back from profile">← Back</button><span>PROFILE · ADI AGARWAL</span></header><img src="assets/adi.webp" alt="Adi Agarwal" decoding="async"><h2 id="mat-mobile-profile-title">Hello, I’m Adi.</h2><p class="profile-subtitle">Product Management · AI Product Development · Product Analytics</p><div class="profile-content"></div><h3>Core toolkit</h3><ul class="profile-skills"></ul><div class="profile-actions"></div></article>';
  document.body.appendChild(dialog);
  var cached = null;
  function node(tag, text) { var e = document.createElement(tag); e.textContent = text; return e; }
  function render(profile) {
    var content = dialog.querySelector('.profile-content'); content.replaceChildren();
    profile.bio.forEach(function (p) { content.appendChild(node('p', p)); });
    var skills = dialog.querySelector('.profile-skills'); skills.replaceChildren();
    profile.skills.forEach(function (s) { skills.appendChild(node('li', s)); });
    var actions = dialog.querySelector('.profile-actions'); actions.replaceChildren();
    [['LinkedIn ↗', profile.linkedin], ['View résumé ↗', profile.resume]].forEach(function (item) { var a = node('a', item[0]); a.href = item[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'; actions.appendChild(a); });
  }
  function close() { if (dialog.open) dialog.close(); button.focus({ preventScroll: true }); }
  button.addEventListener('click', async function () {
    if (!cached) {
      try { var response = await fetch('/data/mat-profile.json'); if (!response.ok) throw Error('unavailable'); cached = await response.json(); render(cached); }
      catch (_) { dialog.querySelector('.profile-content').textContent = 'The profile could not be loaded. Please try again.'; }
    }
    if (!dialog.open) { history.pushState({ matProfile: true }, '', '#profile'); dialog.showModal(); }
  });
  dialog.querySelector('button').addEventListener('click', function () { if (history.state && history.state.matProfile) history.back(); else close(); });
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); if (history.state && history.state.matProfile) history.back(); else close(); });
  window.addEventListener('popstate', function () { if (dialog.open) close(); });
})();
