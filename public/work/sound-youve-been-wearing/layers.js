// One table for everything that maps record ↔ layer ↔ stems.
// Sources: dpi-layered-music-maker README + src/data/layers.ts (names, files, gains, default volumes),
// the sticky notes on the back of the board (photo 03: Red = Synth, Dark Blue = Piano, Orange = Guitar,
// Yellow = Drums, Light Blue = Bass Guitar) and DPI_2.ino (5 PN532 readers, 5 encoders, 5 LEDs per layer).
const A = './media/audio/';
export const LAYERS = [
  { id: 'foundation', name: 'Foundation', record: 'teal', colour: 'light blue', led: '#38bdf8', volume: 0.74,
    options: [
      { name: 'Bass Guitar', url: A + '1-bass-guitar.mp3', gain: 0.88 },
      { name: 'Bass Guitar B', url: A + '1-bass-guitar-b.mp3', gain: 0.84 },
      { name: 'Bouncy Synth Chords', url: A + '1-bouncy-synth-chords.mp3', gain: 3.3 },
    ] },
  { id: 'texture', name: 'Texture', record: 'red', colour: 'red', led: '#ef4444', volume: 0.64,
    options: [
      { name: 'Synth Wavey', url: A + '2-synth-wavey.mp3', gain: 0.74 },
      { name: 'Brushed Snare', url: A + '2-brushed-snare.mp3', gain: 0.7 },
      { name: 'Ethereal Echo Thing', url: A + '2-ethereal-echo-thing.mp3', gain: 7.6 },
    ] },
  { id: 'drums', name: 'Drums', record: 'yellow', colour: 'yellow', led: '#facc15', volume: 0.82,
    options: [
      { name: 'Drum Simple', url: A + '3-drum-simple.mp3', gain: 0.82 },
      { name: 'Drum Poom Tss', url: A + '3-drum-poom-tss.mp3', gain: 0.8 },
      { name: 'Drum w Duck', url: A + '3-drum-w-duck.mp3', gain: 3.4 },
    ] },
  { id: 'keys', name: 'Keys', record: 'darkblue', colour: 'dark blue', led: '#4f7dff', volume: 0.68,
    options: [
      { name: 'Piano 1', url: A + '4-piano-1.mp3', gain: 0.76 },
      { name: 'Piano 2', url: A + '4-piano-2.mp3', gain: 0.74 },
      { name: 'Piano 3', url: A + '4-paino-3.mp3', gain: 2.2 },
    ] },
  { id: 'solo', name: 'Solo', record: 'orange', colour: 'orange', led: '#f97316', volume: 0.72,
    options: [
      { name: 'Guitar Notes', url: A + 'solo-guitar-notes.mp3', gain: 0.78 },
      { name: 'Distort Guitar', url: A + 'solo-distort-guitar.mp3', gain: 0.7 },
      { name: 'Piano Solo', url: A + 'solo-piano-1.mp3', gain: 0.76 },
    ] },
];
export const LOOP_SECONDS = 96;           // DEMO_DURATION_SECONDS in the music app
export const layerForRecord = (recordId) => LAYERS.find((l) => l.record === recordId);
