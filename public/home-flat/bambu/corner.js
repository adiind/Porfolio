(() => {
  const ICON = "img/bambu-studio-app-icon.svg";
  const MQ = matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);
  const reduced = () => MQ.matches || params.has("rm");

  // colours sampled from photo 06 (the filament wall)
  const swatches = [["White", "#b9b3af", 1], ["Magenta", "#7d2357"], ["Red", "#791a0f"], ["Amber", "#a4570a"], ["Orange", "#993804"],
    ["Yellow", "#bb9c1b"], ["Green", "#2b673f"], ["Forest", "#275145"], ["Sky", "#4a74a6"]];

  const photo = (f, alt) => `<img class="bb-photo" src="img/${f}" alt="${alt}" loading="lazy" decoding="async">`;

  const root = document.createElement("div");
  root.className = "bb";
  root.innerHTML = `
  <button class="bb-badge" type="button" aria-haspopup="dialog"><img src="${ICON}" alt=""><span>Bambu Lab Ambassador</span></button>
  <div class="bb-space" role="dialog" aria-modal="true" aria-label="Bambu Lab Ambassador" hidden>
    <button class="bb-x" type="button" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
    <div class="bb-body">
      <header class="bb-band"><div class="bb-band-in">
        <div class="bb-brandline"><img src="${ICON}" alt="">Bambu Lab Ambassador <i>·</i> <i>Northwestern</i></div>
        <div class="bb-profile">
          <span class="bb-avatar"><img src="img/07-adi-portrait.jpg" alt="Adi" decoding="async"></span>
          <div><h2>Adi</h2><p>I run the print lab and teach people how to use Bambu Studio.</p></div>
        </div>
      </div></header>

      <main class="bb-bento">
        <figure class="bb-tile t-hero">${photo("01-printer-wall.jpg", "A row of Bambu Lab printers on a wall, each with a glowing light above it")}
          <figcaption class="bb-cap">The printer wall. A nozzle light over every machine.</figcaption></figure>

        <figure class="bb-tile t-nozzle">${photo("05-nozzle-light.jpg", "A nozzle light on the wall glowing orange")}<span class="bb-glow" aria-hidden="true"></span>
          <figcaption class="bb-cap">One of the nozzle lights, up close.</figcaption></figure>

        <section class="bb-tile bb-card t-do">
          <h3>What I do as ambassador</h3>
          <ul class="bb-do">
            <li style="--dot:var(--c-orange)"><b>Run the print lab</b><span>The printers, the filament, the wall of nozzle lights.</span></li>
            <li style="--dot:var(--c-sky)"><b>Teach Bambu Studio</b><span>Workshops where we slice a part and print it together.</span></li>
          </ul>
        </section>

        <figure class="bb-tile t-fil">${photo("06-filament-wall.jpg", "Rows of filament spools in many colours")}
          <figcaption class="bb-cap">Filament, sorted by colour.</figcaption></figure>

        <div class="bb-tile t-sw" role="img" aria-label="Filament colours from the wall">
          <span class="bb-sw-label">Colours off the wall</span>
          ${swatches.map(([n, c, l]) => `<span class="bb-sw${l ? " light" : ""}" style="--c:${c}"></span>`).join("")}
        </div>

        <figure class="bb-tile t-work">${photo("13-adi-presenting.jpg", "Adi presenting in front of a projected Bambu Studio screen")}
          <figcaption class="bb-cap">Walking a group through Bambu Studio. [CONFIRM: which workshop]</figcaption></figure>

        <section class="bb-tile bb-card t-room">
          <h3>The printers in the room</h3>
          <div class="bb-room-name">Bambu Lab X1 Carbon<small>On the wall and the tables</small></div>
          <p class="bb-note">[CONFIRM: how many, and whether the H2D in the photos belongs on this list]</p>
        </section>

        <section class="bb-tile bb-card t-teach">
          <h3>What a workshop covers</h3>
          <p class="bb-quote">Which way it sits. <em>Where it needs support.</em> How fine the layers go.</p>
        </section>

        <figure class="bb-tile t-slice">${photo("17-supports-preview.jpg", "Bambu Studio preview of a part with green supports under an overhang")}
          <figcaption class="bb-cap">Supports in the slicer. The green is what holds up the overhang. [CONFIRM: is this your model?]</figcaption></figure>
      </main>
    </div>
  </div>`;
  document.body.append(root);

  const badge = root.querySelector(".bb-badge"), space = root.querySelector(".bb-space");
  const body = root.querySelector(".bb-body"), x = root.querySelector(".bb-x");
  const tiles = [...root.querySelectorAll(".bb-tile")];
  let isOpen = false, busy = false, io;

  function watch() {
    io?.disconnect();
    tiles.forEach(t => t.classList.remove("is-in"));
    root.classList.toggle("bb-rm", reduced());
    io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const i = tiles.indexOf(e.target);
      e.target.style.transitionDelay = reduced() ? "0ms" : `${(i % 3) * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { root: body, threshold: 0.08 });
    tiles.forEach(t => io.observe(t));
  }
  function show() { space.classList.remove("is-washing"); busy = false; x.focus({ preventScroll: true }); }
  function open() {
    if (isOpen) return;
    isOpen = true; busy = true;
    document.documentElement.classList.add("bb-lock");
    space.hidden = false; body.scrollTop = 0; watch();
    if (reduced()) return show();
    // the one transition: a pale wash spreads from the badge
    const r = badge.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    space.classList.add("is-washing");
    const a = space.animate({ clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${far}px at ${cx}px ${cy}px)`] },
      { duration: 600, easing: "cubic-bezier(.3,.6,.3,1)", fill: "both" });
    window.__bbWash = a;
    a.onfinish = () => { a.cancel(); show(); };
  }
  function close() {
    if (!isOpen || busy) return;
    isOpen = false; space.hidden = true;
    document.documentElement.classList.remove("bb-lock");
    badge.focus({ preventScroll: true });
  }
  badge.addEventListener("click", open);
  x.addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key === "Tab") { e.preventDefault(); x.focus(); }   // the X is the only control
  });
  ["wheel", "touchmove"].forEach(t => space.addEventListener(t, e => e.stopPropagation(), { passive: true }));
})();
