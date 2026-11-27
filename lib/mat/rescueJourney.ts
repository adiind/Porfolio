/**
 * Food Rescue: the words. One example order, told as seven numbered events, plus the result and Adi's part.
 *
 * THIS FILE IS THE ONLY PLACE COPY LIVES. The board, the map tags and the screen-reader text all read from here.
 * Do not write story text anywhere else, and do not reword it without Adi.
 *
 * Every line carries where it came from:
 *   deck    his 4-slide case study (~/Downloads/Zomato- Food Rescue.pdf)
 *   app     the real offer screen (public/images/mat/food-rescue/offer.webp): "An order was just cancelled.
 *           Claim at just ₹322 ₹175 · Freshly prepared · Safely sealed · Claim in 6:49 mins"
 *   resume  his résumé and live site
 *   site    data/timeline.ts on his live site since December 2025
 *   fromHim said by Adi in chat only. NEEDS HIS OK BEFORE THIS GOES PUBLIC.
 *   example made up for the one example order (clock times). Marked on screen as an example.
 */
export type Source = 'deck' | 'app' | 'resume' | 'site' | 'fromHim' | 'example';
export type Tone = 'go' | 'stop' | 'pay';

export interface JourneyStep {
  /** the number printed beside the event, on the board and on the map */
  n: string;
  /** seconds into the film when this event starts */
  at: number;
  /** example clock time for the log */
  clock: string;
  title: string;
  /** what happens */
  line: string;
  /**
   * The figure or the one product rule behind this event (null when the event needs none). A rule starts with "Rule:".
   * Adi, 2026-11-17: "everything does not need to be ruled". Only the no-offer rule is a rule; it is shown in yellow.
   */
  why: string | null;
  /** short label for the paper tag on the map, at the place the event happens */
  tag: string;
  tone: Tone;
  source: Source[];
  /** kept for the older scene code: title + lines + a status colour */
  lines: string[];
  color: string;
}

const GREEN = '#b8ffc9'; const RED = '#ff8b91'; const GOLD = '#ffda87';

const step = (s: Omit<JourneyStep, 'lines' | 'color'>): JourneyStep =>
  ({ ...s, lines: [s.line, ...(s.why ? [s.why] : [])], color: s.tone === 'stop' ? RED : s.tone === 'pay' ? GOLD : GREEN });

export const journeySteps: readonly JourneyStep[] = [
  step({ n: '01', at: 0, clock: '8:02 pm', title: 'Order cooked',
    line: 'The meal is made. Its cost is already spent.',
    why: null, tag: 'Order ready', tone: 'go', source: ['deck', 'example'] }),
  step({ n: '02', at: 2.0, clock: '8:09 pm', title: 'Rider on the way',
    line: 'The rider heads to the first address.',
    why: null, tag: 'Picked up', tone: 'go', source: ['deck', 'example'] }),
  step({ n: '03', at: 4.4, clock: '8:14 pm', title: 'Customer cancels',
    line: 'The meal is cooked, packed and on the road.',
    why: 'About 400,000 orders a month ended here, with the food thrown away.',
    tag: 'Cancelled', tone: 'stop', source: ['deck', 'example'] }),
  step({ n: '04', at: 7.2, clock: '8:14 pm', title: 'Offer goes out nearby',
    line: 'People near the rider can claim the same meal. Closest buyer first.',
    why: 'Rule: whoever cancelled, and the people next to them, never get the offer.',
    tag: 'Offered nearby', tone: 'go', source: ['deck', 'fromHim', 'example'] }),
  step({ n: '05', at: 10.6, clock: '8:16 pm', title: 'A neighbour claims it',
    line: 'A ₹322 meal for ₹175, freshly made and sealed.',
    why: null,
    tag: 'Claimed', tone: 'go', source: ['app', 'example'] }),
  step({ n: '06', at: 13.0, clock: '8:17 pm', title: 'Rider is rerouted',
    line: 'A short detour to the new address. The rider is paid in full for it.',
    why: null,
    tag: 'New address', tone: 'pay', source: ['deck', 'example'] }),
  step({ n: '07', at: 15.4, clock: '8:24 pm', title: 'Meal delivered',
    line: 'Eaten a few streets away, not thrown away.',
    why: null, tag: 'Delivered', tone: 'go', source: ['deck', 'example'] }),
];

/** Printed at the top of the board. */
export const header = {
  project: 'Food Rescue',
  company: 'Zomato',
  role: 'Lead Product Analyst',
  years: '2024 to 2025',
  /** what the log is */
  kicker: 'One cancelled order, event by event',
  example: 'Example order',
} as const;

/** What each side loses when an order is cancelled (deck, slide 2). Paper tags on the map at event 03: at the shop, under the rider, under the house that cancelled. */
export const losses = [
  { who: 'Restaurant', text: 'Food cost lost', source: 'deck' },
  { who: 'Rider', text: 'Trip wasted', source: 'deck' },
  // deck, slide 2, Users: "Genuine users incurred partial-refund losses."
  { who: 'Customer', text: 'Partial refund lost', source: 'deck' },
] as const;

/** What each side gets once the meal is rescued (deck, slide 3). On the board's result block and as map tags at event 07. */
export const gains = [
  { who: 'Buyer', text: 'A fresh meal in minutes, at a steep discount', short: 'Fresh meal, lower price', source: 'deck' },
  { who: 'Restaurant', text: 'The meal is eaten, not thrown away', short: 'Meal eaten', source: 'deck' },
  { who: 'Rider', text: 'Paid in full for the detour', short: 'Paid in full', source: 'deck' },
] as const;

/** The result, at the foot of the board. */
export const result = {
  /** printed before the figure (Adi: "we should say that this led to") */
  lead: 'This led to',
  figure: '~50%',
  caption: 'less food waste across India',
  /** heading over the three gains (Adi: "the value proposition for buyer, restaurants right here") */
  gainsTitle: 'The value for each side',
  press: 'Covered by Times of India, NDTV and Verdict Foodservice',
  source: ['resume', 'deck'],
} as const;

/** The real offer, from the app screen (public/images/mat/food-rescue/offer.webp). */
export const offer = {
  /** paper tag at the buyer's house */
  priceTag: '₹175, was ₹322',
  /** printed under the app-screen photo lying on the mat */
  caption: 'The offer, as it showed in the app',
  source: ['app'],
} as const;

/** The houses the offer wave reaches at event 04, in the order the scene builds them. */
export const neighbours = [
  { id: 'far', outcome: 'offered', tag: 'Offered' },
  { id: 'nextDoor', outcome: 'skipped', tag: 'Skipped: next to the cancel' },
  { id: 'buyer', outcome: 'claimed', tag: 'Claimed' },
] as const;

/**
 * Adi's part, in his words (chat, 2026-11-17): "I ran experiments and did A/B testing and did analytics to understand the
 * customer preference and ... discount elasticity of this entire thing. Changing the MQTT times and the radius and adding
 * in new rules, understanding fraud and all of that. My part is bigger than you think." MQTT is the messaging that sends
 * the offer out to phones nearby; it is named once, in brackets. The second line is from his live site and he confirmed
 * it the same day. While `confirmed` is false the sheet prints a small "Draft" mark; it is true, so no mark.
 */
export const myPart = {
  title: 'My part',
  role: 'Lead Product Analyst, Zomato',
  confirmed: true,
  lines: [
    "Ran experiments and A/B tests to learn what customers prefer and how the discount's size changes buying (discount elasticity).",
    'Did the analytics behind what discount to show, to whom, and for how long.',
    'Tuned how the offer is broadcast (over MQTT): the wait between waves and the radius it reaches.',
    'Added new rules and studied fraud, so a cancelled order could not be turned into a discount.',
  ],
  source: ['fromHim', 'site'],
} as const;

export const [, PICKUP, CANCELLED, OFFERS, ACCEPTED, REROUTED, DELIVERED] = journeySteps.map(({ at }) => at);
/** the cancellation signal reaches the rider and the rider stops */
export const DRIVER_STOPPED = CANCELLED + .5;
/** the handover at the new door is finished */
export const REWARD_SETTLED_AT = DELIVERED + .45;
/** the result and "My part" land */
export const AFTER_AT = DELIVERED + 1;
/** nothing moves after this; the finished board stays to be read */
export const JOURNEY_END = DELIVERED + 2.2;

/**
 * How fast the journey's clock runs on screen. The event times above stay as they are (the order log, the arrow keys and
 * the tests read them); the film plays them this many times faster. Adi, 2026-11-27: the 17.6 s film was "too slow";
 * shown 11 s and 9 s, he said "I want 9 seconds". At 2 it plays in 8.8 s.
 */
export const JOURNEY_RATE = 2;

/** Which event is showing at `seconds` (0-based). */
export function journeyAt(seconds: number) {
  const next = journeySteps.findIndex(step => step.at > seconds);
  return next === -1 ? journeySteps.length - 1 : Math.max(0, next - 1);
}
