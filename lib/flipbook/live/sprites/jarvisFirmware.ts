/**
 * JARVIS_FIRMWARE: facts copied by hand from the firmware on 2026-11-15.
 * Source repo: adiind/diy-jarvis (one visible commit, c14aa02). Nothing here was run or estimated.
 * Paths are relative to the repo root. "ino" = diy-jarvis/diy-jarvis.ino (582 lines),
 * "lib.cpp" = Maix_Speech_Recognition/src/Maix_Speech_Recognition.cpp, "lib.h" = the .h beside it,
 * "util/X" = Maix_Speech_Recognition/src/util/X. Credentials at ino lines 12-16 are deliberately NOT copied.
 *
 * Field sources:
 *  leds            ino:52-55 (#define LED_SYSTEM 5, LED_SPEECH 4, LED_NETWORK 3, LED_MOTION 2). README wiring agrees.
 *  pirPin          ino:56 (#define PIR_PIN 8)
 *  patterns        ino:65-109 startupLEDSequence; 112-135 wifiConnectingSequence; 235-275 setup_wifi;
 *                  278-304 checkMotion; 306-327 updateSpeechLED; 331-340 handleVoiceCommand; 548-582 loop
 *  timing          ino:47-48, 58-61, 557; lib.h:41
 *  phrases         ino:346-424 (switch), ino:453-530 (addVoiceModel calls, model index = id - 1);
 *                  lib.cpp:432 returns min_comm = cmd index + 1, which is the id the switch receives.
 *                  README table: README.md "Project-Specific Voice Commands".
 *  match           lib.cpp:107, 158-174, 401-447; lib.h:39-41; util/DTW.c:182-196, 273, 336;
 *                  util/MFCC.h:6-16; util/MFCC.c:215, 233, 272; util/VAD.h:7-10; util/ADC.h:5-9
 *  topics          ino:20-28 (names), ino:143-206 (discovery topics), ino:138 (publish is retained)
 *
 * Step encoding: each step = { on: LEDs lit, ms: how long this state lasts }.
 * LED names: system, speech, network, motion.
 */

export type LedName = 'system' | 'speech' | 'network' | 'motion'

export interface LedStep {
  /** LEDs that are lit during this step. Empty array means all four are off. */
  on: readonly LedName[]
  /** Duration of this step in milliseconds. */
  ms: number
  /** Source lines for this step. */
  line: string
}

export interface LedPattern {
  name: string
  when: string
  /** 'once' = plays one time; 'loop' = repeats; 'state' = a steady state, not an animation. */
  kind: 'once' | 'loop' | 'state'
  /** Number of times the step list repeats, if the code repeats it with a for-loop. */
  repeat?: number
  steps: readonly LedStep[]
  note?: string
}

const ALL: readonly LedName[] = ['system', 'speech', 'network', 'motion']

export const JARVIS_FIRMWARE = {
  leds: [
    { name: 'system', pin: 5 }, // ino:52 "System ON/OFF status"
    { name: 'speech', pin: 4 }, // ino:53 "Speech recognition activity"
    { name: 'network', pin: 3 }, // ino:54 "Network status"
    { name: 'motion', pin: 2 }, // ino:55 "Motion detection"
  ],
  pirPin: 8, // ino:56 "Motion sensor"

  patterns: [
    {
      name: 'startup',
      when: 'Power-up: setup() runs startupLEDSequence() right after the pins are set up (ino:444)',
      kind: 'once',
      steps: [
        // ino:66-71 all off, delay(500)
        { on: [], ms: 500, line: 'ino:66-71' },
        // ino:74-94 for (i = 0; i < 3; i++): forward then reverse, each delay(LED_SEQUENCE_DELAY) = 100 ms,
        // last delay is LED_SEQUENCE_DELAY * 2 = 200 ms. Written out once below; repeat the 8 steps 3 times.
        { on: ['system'], ms: 100, line: 'ino:76-77' },
        { on: ['system', 'speech'], ms: 100, line: 'ino:78-79' },
        { on: ['system', 'speech', 'network'], ms: 100, line: 'ino:80-81' },
        { on: ALL, ms: 100, line: 'ino:82-83' },
        { on: ['system', 'speech', 'network'], ms: 100, line: 'ino:86-87 motion off' },
        { on: ['system', 'speech'], ms: 100, line: 'ino:88-89 network off' },
        { on: ['system'], ms: 100, line: 'ino:90-91 speech off' },
        { on: [], ms: 200, line: 'ino:92-93 system off, LED_SEQUENCE_DELAY * 2' },
        // ino:97-108 for (i = 0; i < 3; i++): all on 200 ms, all off 200 ms ("Final flash all together")
        { on: ALL, ms: 200, line: 'ino:98-102' },
        { on: [], ms: 200, line: 'ino:103-107' },
      ],
      note:
        'Not one flat list. Order: (1) the first step once; (2) the next 8 steps (sweep up and back) played 3 times (ino:74 loop of 3); ' +
        '(3) the last 2 steps (all-on / all-off flash) played 3 times (ino:97 loop of 3). ' +
        'Sweep pass = 7 x 100 ms + 1 x 200 ms = 900 ms. Total = 500 + 3*900 + 3*400 = 4400 ms.',
    },
    {
      name: 'wifi-connecting',
      when: 'Joining Wi-Fi: setup_wifi() calls wifiConnectingSequence() every pass of its while loop until connected (ino:256-260)',
      kind: 'loop',
      steps: [
        // ino:116 WIFI_BLINK_INTERVAL = 300; ino:119-131 clears all, lights one; ino:133 ledState = (ledState + 1) % 4
        { on: ['system'], ms: 300, line: 'ino:127 case 0' },
        { on: ['speech'], ms: 300, line: 'ino:128 case 1' },
        { on: ['network'], ms: 300, line: 'ino:129 case 2' },
        { on: ['motion'], ms: 300, line: 'ino:130 case 3' },
      ],
      note:
        'One LED at a time, cycling system, speech, network, motion, then round again, until Wi-Fi is up. ' +
        'The step is only taken when 300 ms (WIFI_BLINK_INTERVAL) have passed since the last one, but the loop is checked every ~100 ms (ino:259 delay(100)) and WiFi.begin is called inside the same loop, so real steps can run longer than 300 ms.',
    },
    {
      name: 'wifi-connected',
      when: 'Wi-Fi joined: the success pattern in setup_wifi() (ino:262-270)',
      kind: 'once',
      steps: [
        { on: ['system'], ms: 200, line: 'ino:263-264' },
        { on: ['system', 'speech'], ms: 200, line: 'ino:265-266' },
        { on: ['system', 'speech', 'network'], ms: 200, line: 'ino:267-268' },
        { on: ALL, ms: 1000, line: 'ino:269-270' },
      ],
      note: 'LEDs stay on after this; the main loop then sets them from real state (ino:552, 322-325).',
    },
    {
      name: 'wifi-module-missing',
      when: 'WiFi.status() == WL_NO_SHIELD, so the ESP Wi-Fi module is not found (ino:236-250)',
      kind: 'loop',
      steps: [
        { on: ALL, ms: 500, line: 'ino:240-244' },
        { on: [], ms: 500, line: 'ino:245-249' },
      ],
      note: 'Endless: while (true), never leaves. Error flash, all four together.',
    },
    {
      name: 'broker-connecting',
      when: 'MQTT broker not yet connected (loop(), ino:552-562). The code has NO dedicated blink for this.',
      kind: 'state',
      steps: [{ on: [], ms: 5000, line: 'ino:552, 557' }],
      note:
        'The network LED simply mirrors client.connected(): off while not connected, on when connected (ino:552, also 324). ' +
        'A reconnect is tried every 5000 ms (ino:557 "now - lastReconnectAttempt > 5000"; log line ino:229 "retry in 5s"). ' +
        'MQTT_BLINK_INTERVAL = 200 (ino:61, comment "For MQTT connecting pattern") is declared but never used anywhere else in the file. ' +
        'The "on: []" step is a placeholder meaning "network LED off"; other LEDs follow the idle rules below.',
    },
    {
      name: 'motion-seen',
      when: 'PIR pin goes from LOW to HIGH (ino:282)',
      kind: 'state',
      steps: [
        { on: ['motion'], ms: 6000, line: 'ino:286 on; ino:293-296 off after MOTION_TIMEOUT' },
        { on: [], ms: 0, line: 'ino:296 motion LED low' },
      ],
      note:
        'Motion LED goes on at the rising edge and off 6000 ms later (MOTION_TIMEOUT, ino:47). The timer starts at the rising edge only (ino:284); ' +
        'a PIR that stays HIGH does not extend it. While motion is active the board also starts listening (ino:571).',
    },
    {
      name: 'listening',
      when: 'motionDetected || systemActive is true, so recognition runs (ino:571-574)',
      kind: 'state',
      steps: [{ on: ALL, ms: 200, line: 'ino:311-318' }],
      note:
        'Every LISTENING_PATTERN_INTERVAL = 200 ms all four LEDs are set HIGH (ino:315-318). It is steady all-on, not a blink: nothing in this branch turns them off. ' +
        'rec.recognize() (ino:574) blocks for up to 6000 ms (lib.h:41 TIMEOUT_MS), so the LEDs hold whatever they were last set to while it waits.',
    },
    {
      name: 'idle',
      when: 'Not listening: motionDetected and systemActive both false (ino:578-580, rules at 321-325)',
      kind: 'state',
      steps: [{ on: [], ms: 0, line: 'ino:322-325' }],
      note:
        'No animation. Each LED shows one flag: system = systemActive, speech = off, network = client.connected(), motion = motionDetected.',
    },
    {
      name: 'phrase-recognised',
      when: 'rec.recognize() returns a number above 0, so handleVoiceCommand() runs (ino:575-576)',
      kind: 'once',
      repeat: 2,
      steps: [
        { on: ['speech'], ms: 100, line: 'ino:336-337' },
        { on: [], ms: 100, line: 'ino:338-339' },
      ],
      note:
        'Only the speech LED is toggled (the speech LED goes on 100 ms, off 100 ms, twice; ino:335 "for(int i = 0; i < 2; i++)"). ' +
        'The other three LEDs are not touched by this function, so they keep their listening state (all on). ' +
        'Then, for command 2 (bye bye) system LED goes low (ino:358); for command 8 (wake up) it goes high (ino:404).',
    },
  ] satisfies readonly LedPattern[],

  timing: {
    motionTimeoutMs: 6000, // ino:47 const unsigned long MOTION_TIMEOUT = 6000;  (no comment on the line)
    constants: [
      { name: 'MOTION_TIMEOUT', ms: 6000, line: 'ino:47', comment: null },
      { name: 'SPEECH_BLINK_INTERVAL', ms: 100, line: 'ino:48', comment: null, note: 'declared, never used' },
      { name: 'LED_SEQUENCE_DELAY', ms: 100, line: 'ino:58', comment: 'Basic delay for LED sequences' },
      { name: 'LISTENING_PATTERN_INTERVAL', ms: 200, line: 'ino:59', comment: 'For sound recognition pattern' },
      { name: 'WIFI_BLINK_INTERVAL', ms: 300, line: 'ino:60', comment: 'For WiFi connecting pattern' },
      { name: 'MQTT_BLINK_INTERVAL', ms: 200, line: 'ino:61', comment: 'For MQTT connecting pattern', note: 'declared, never used' },
      { name: 'broker reconnect retry (literal)', ms: 5000, line: 'ino:557', comment: null },
      { name: 'TIMEOUT_MS (speech library)', ms: 6000, line: 'lib.h:41', comment: '6 second timeout' },
    ],
    // setup() literal delays: ino:431 delay(1000) after Serial; ino:448 delay(1000) after rec.begin(); ino:537 delay(1000) after WiFi.init.
    setupDelaysMs: [1000, 1000, 1000],
  },

  /**
   * id = the number the sketch's switch receives (ino:346). The recognizer's model/keyword index is id - 1
   * (ino:453 "addVoiceModel(0, ..." is id 1; ino:493 "addVoiceModel(5, ..." is id 6; lib.cpp:432 min_comm = i + 1).
   * Every publish is a retained MQTT message, ON or OFF (ino:138).
   */
  phrases: [
    {
      id: 1,
      label: 'alfred_batcave_on', // ino:347 case comment
      topic: 'home-assistant/voice-control/alfred/state', // ino:21, publish at ino:349
      action: 'toggles alfredState and publishes the new state, ON or OFF (ino:348-349)',
      readme: "Alfred Let's Go",
      note: 'MISMATCH: README says "Alfred Let\'s Go"; code, comment, serial text ("Alfred Batcave On", ino:350) and recording file (alfred_batcave_on.txt) all say Batcave.',
    },
    {
      id: 2,
      label: 'bye_bye_jarvis_jarvis', // ino:355 case comment, verbatim (the doubled word is in the source)
      topic: 'home-assistant/voice-control/system/state', // ino:22, publish at ino:357
      action: 'sets systemActive false, publishes OFF, system LED low (ino:356-358)',
      readme: 'Bye Bye Jarvis',
    },
    {
      id: 3,
      label: 'cooking_mode', // ino:363
      topic: 'home-assistant/voice-control/cooking/state', // ino:23, publish at ino:365
      action: 'toggles cookingState and publishes it (ino:364-365)',
      readme: 'Cooking Mode',
    },
    {
      id: 4,
      label: 'goodnight_jarvis', // ino:371
      topic: 'home-assistant/voice-control/goodnight/state', // ino:24, publish at ino:373
      action: 'toggles goodnightState and publishes it (ino:372-373)',
      readme: 'Goodnight Jarvis',
    },
    {
      id: 5,
      label: 'jarvis_goodmorning', // ino:379
      topic: 'home-assistant/voice-control/goodmorning/state', // ino:25, publish at ino:381
      action: 'toggles goodmorningState and publishes it (ino:380-381)',
      readme: 'Jarvis Good Morning',
    },
    {
      id: 6,
      label: 'jarvis_lights_on', // ino:387
      topic: 'home-assistant/voice-control/light/state', // ino:26, publish at ino:389
      action: 'sets lightState true and publishes ON (not a toggle) (ino:388-389)',
      readme: 'Jarvis Lights On',
      note: 'README describes it as "Activates configured lights"; the code only publishes ON to one topic, the lights are switched by Home Assistant.',
    },
    {
      id: 7,
      label: 'lights_off_jarvis', // ino:394
      topic: 'home-assistant/voice-control/light/state', // ino:26, publish at ino:396
      action: 'sets lightState false and publishes OFF (ino:395-396)',
      readme: 'Lights Off Jarvis',
    },
    {
      id: 8,
      label: 'wake_up_jarvis', // ino:401
      topic: 'home-assistant/voice-control/system/state', // ino:22, publish at ino:403
      action: 'sets systemActive true, publishes ON, system LED high (ino:402-404)',
      readme: 'Wake Up Jarvis',
    },
    {
      id: 9,
      label: 'clap_clap', // ino:409
      topic: 'home-assistant/voice-control/clap/state', // ino:27, publish at ino:411
      action: 'toggles clapMode and publishes it (ino:410-411)',
      readme: 'Clap Clap',
      note: 'README MQTT topic list and Home Assistant YAML omit this topic; no discovery config is published for it (ino:141-207 covers only 7 entities).',
    },
    {
      id: 10,
      label: 'jarvis_demo_mode', // ino:417
      topic: 'home-assistant/voice-control/demo/state', // ino:28, publish at ino:419
      action: 'toggles demoMode and publishes it (ino:418-419)',
      readme: 'Jarvis Demo Mode',
      note: 'README topic list and YAML omit this topic; no discovery config is published for it.',
    },
  ],

  match: {
    /** Average distance above this is rejected as "No match found". lib.cpp:440 `if (min_avg_dis > 300 || min_avg_dis == dis_max)` */
    rejectAboveAverageDistance: 300,
    recordingsPerPhrase: 6, // ino:453-458 (six addVoiceModel calls per phrase); lib.h:40 MAX_MODELS_PER_KEY = 6; README "Complete all 6 samples"
    phraseCount: 10, // ino:453-530
    /**
     * How the six recordings are combined: a MEAN of distances, then the phrase with the lowest mean wins.
     *  lib.cpp:404-420  for each valid recording: cur_dis = dtw(model, spoken) (line 408)
     *  lib.cpp:416-418  `if (cur_dis != dis_err && cur_dis > 0) { cmd_distances[cmd] += cur_dis; valid_matches[cmd]++; }`
     *  lib.cpp:426      `u32 avg_dis = cmd_distances[i] / valid_matches[i];`  (integer division)
     *  lib.cpp:430-433  `if (avg_dis < min_avg_dis && avg_dis > 0) { min_avg_dis = avg_dis; min_comm = i + 1; }`
     * Recordings that fail the frame-count gate (dtw returns dis_err) are skipped, not counted.
     * It is not a minimum over the six and not a template average: the six recordings are kept separate.
     */
    combine: 'mean of the per-recording DTW distances, lowest mean wins',
    dtw: {
      // util/DTW.c:182-196 active get_dis (inside "#else / #if 1"): cosine distance between two 12-number frames
      frameDistance: '1000 - cosine similarity * 1000, per pair of frames (DTW.c:194)',
      // util/DTW.c:336 `return (dis/step);`
      pathNormalised: 'accumulated path distance divided by path length (DTW.c:336)',
      // util/DTW.c:273 `(in_frm_num > (mdl_frm_num*3)) || ((3*in_frm_num) < mdl_frm_num)` returns dis_err
      lengthGate: 'recording and speech must be within 3x of each other in frame count (DTW.c:273)',
    },
    sampleRateHz: 8000, // util/ADC.h:5 `#define fs 8000`; lib.cpp:107 i2s_set_sample_rate(I2S_DEVICE_0, 8000)
    frameMs: 20, // util/VAD.h:7 frame_time
    hopMs: 10, // util/VAD.h:8 frame_mov_t; hop = FRAME_LEN - frame_mov = 160 - 80 samples (MFCC.c:157 loop step)
    frameSamples: 160, // FRAME_LEN = frame_time * fs / 1000 (VAD.h:9)
    hopSamples: 80, // frame_mov = frame_mov_t * fs / 1000 (VAD.h:10)
    coefficientsPerFrame: 12, // util/MFCC.h:13 mfcc_num
    filterBands: 24, // util/MFCC.h:11 tri_num
    fftPoints: 512, // util/MFCC.h:7 mfcc_fft_point
    maxFramesPerRecording: 219, // util/MFCC.h:15-16 vv_tim_max 2200 ms -> (2200-20)/(20-10)+1 = 219
    noiseCalibrationMs: 300, // util/ADC.h:8 atap_len_t
    preEmphasis: 0.95, // util/MFCC.h:6 hp_ratio(x) = x*95/100
    speechTimeoutMs: 6000, // lib.h:41; lib.cpp:292
  },

  topics: {
    publishes: [
      'home-assistant/voice-control/motion/state', // ino:20
      'home-assistant/voice-control/alfred/state', // ino:21
      'home-assistant/voice-control/system/state', // ino:22
      'home-assistant/voice-control/cooking/state', // ino:23
      'home-assistant/voice-control/goodnight/state', // ino:24
      'home-assistant/voice-control/goodmorning/state', // ino:25
      'home-assistant/voice-control/light/state', // ino:26
      'home-assistant/voice-control/clap/state', // ino:27
      'home-assistant/voice-control/demo/state', // ino:28
    ],
    discovery: [
      'homeassistant/binary_sensor/voice-control-motion/config', // ino:143
      'homeassistant/switch/voice-control-alfred/config', // ino:152
      'homeassistant/switch/voice-control-system/config', // ino:160
      'homeassistant/switch/voice-control-cooking/config', // ino:168
      'homeassistant/switch/voice-control-goodnight/config', // ino:176
      'homeassistant/switch/voice-control-goodmorning/config', // ino:184
      'homeassistant/switch/voice-control-light/config', // ino:192
    ],
    /** grep for "subscribe" and "callback" finds nothing in diy-jarvis.ino: the board only publishes. */
    subscribes: [] as string[],
    retained: true, // ino:138 client.publish(topic, state ? "ON" : "OFF", true)
  },

  /** Differences between README and code found while reading. */
  mismatches: [
    'README command 1 is "Alfred Let\'s Go"; code and recording are "Alfred Batcave On" (ino:347-350).',
    'README "Night Navigation: Auto-off after 4 seconds"; code MOTION_TIMEOUT is 6000 ms (ino:47).',
    'README topic list and YAML list 7 topics; code defines 9 (clap ino:27, demo ino:28 missing from README).',
    'MQTT_BLINK_INTERVAL and SPEECH_BLINK_INTERVAL are declared and never used (ino:48, 61).',
    'The "listening" LED state is steady all-on, not a blink pattern, although a 200 ms interval constant suggests one (ino:311-318).',
  ],
} as const
