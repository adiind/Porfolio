// A cut-down port of StemMusicEngine.ts from dpi-layered-music-maker (same signal chain, gains,
// ramps and shared 96 s clock). Differences, for phones: a layer's stem only loads when its key goes in,
// and each layer holds at most one decoded buffer (swapping a take disposes the old one).
import { LAYERS, LOOP_SECONDS } from './layers.js';

const MASTER_LEVEL = 0.92, LAYER_RAMP = 0.08, FADE = 0.06;

export class Engine {
  constructor(onStatus = () => {}) {
    this.onStatus = onStatus;
    this.ok = typeof window.Tone !== 'undefined';
    this.state = this.ok ? 'idle' : 'error';
    this.error = this.ok ? '' : 'Tone.js did not load';
    this.t0 = null;
    this.L = Object.fromEntries(LAYERS.map((l) => [l.id, { def: l, present: false, volume: l.volume, option: 0, player: null, loading: null, url: null }]));
    this.bytes = 0;
  }
  // must be called inside a user gesture (iOS)
  unlock() {
    if (!this.ok) return;
    const T = window.Tone;
    try { T.start(); } catch (e) { /* resumed on next gesture */ }
    if (this.master) return;
    this.limiter = new T.Limiter(-1).toDestination();
    this.comp = new T.Compressor({ threshold: -16, ratio: 2.4, attack: 0.012, release: 0.2 }).connect(this.limiter);
    this.master = new T.Gain(MASTER_LEVEL).connect(this.comp);
    this.meter = new T.Meter({ normalRange: true, smoothing: 0.5 });
    this.master.connect(this.meter);
    for (const s of Object.values(this.L)) s.ch = new T.Gain(0).connect(this.master);
    this.state = 'ready'; this.onStatus();
  }
  offset() { return this.t0 === null ? 0 : Math.max(0, window.Tone.now() - this.t0) % LOOP_SECONDS; }
  level(s) { return s.present ? s.volume * s.def.options[s.option].gain : 0; }
  ramp(s) { if (s.ch) { const T = window.Tone, now = T.now(); s.ch.gain.cancelScheduledValues(now); s.ch.gain.rampTo(this.level(s), LAYER_RAMP, now); } }

  async ensurePlayer(s) {
    const url = s.def.options[s.option].url;
    if (s.player && s.url === url) return s.player;
    if (s.loading && s.loadingUrl === url) return s.loading;
    const T = window.Tone;
    const old = s.player; s.player = null; s.url = null; s.on = false;
    if (old) { try { old.stop(T.now() + FADE); } catch (e) {} setTimeout(() => old.dispose(), 400); }
    s.loadingUrl = url;
    s.loading = (async () => {
      this.onStatus();
      const p = new T.Player({ loop: true, loopStart: 0, loopEnd: LOOP_SECONDS, fadeIn: FADE, fadeOut: FADE });
      await p.load(url);
      this.bytes += 1;
      if (s.loadingUrl !== url) { p.dispose(); return null; }   // a newer take was picked meanwhile
      p.connect(s.ch); s.player = p; s.url = url; s.loading = null; this.onStatus();
      return p;
    })().catch((e) => { s.loading = null; this.state = 'error'; this.error = String(e && e.message || e); this.onStatus(); return null; });
    return s.loading;
  }
  async sync(s) {
    if (!this.ok || !this.master) return;
    const T = window.Tone;
    this.ramp(s);
    if (s.present) {
      if (this.t0 === null) this.t0 = T.now() + 0.05;
      const p = await this.ensurePlayer(s);
      if (!p || !s.present || s.on) return;
      p.start(T.now() + 0.02, this.offset()); s.on = true;
    } else if (s.player && s.on) {
      s.player.stop(T.now() + FADE); s.on = false;
    }
    this.onStatus();
  }
  setPresent(id, v) { const s = this.L[id]; s.present = v; this.sync(s); }
  setVolume(id, v) { const s = this.L[id]; s.volume = Math.min(1, Math.max(0, v)); this.ramp(s); }
  nextOption(id) {
    const s = this.L[id]; s.option = (s.option + 1) % s.def.options.length;
    if (s.player && s.on) { try { s.player.stop(window.Tone.now() + FADE); } catch (e) {} }
    s.on = false;
    this.ramp(s);
    if (s.present) this.sync(s); else this.onStatus();
  }
  setOption(id, n) {                       // pick a take directly (the key's NFC payload says which)
    const s = this.L[id]; if (s.option === n) return;
    s.option = n;
    if (s.player && s.on) { try { s.player.stop(window.Tone.now() + FADE); } catch (e) {} }
    s.on = false; this.ramp(s);
  }
  rms() { return this.meter ? this.meter.getValue() : 0; }
  isLoading(id) { return !!this.L[id].loading; }
  isPlaying(id) { const s = this.L[id]; return s.present && !!s.on; }
}
