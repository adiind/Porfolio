import { describe, expect, it } from 'vitest';
import { explore, formatViolation, PROPERTIES, type Config, type Lifts } from './dialogHistory.explore';

/** Outside actions per schedule (open, close, Back, Forward); every order of the page's own tasks is tried in between. */
const MAX_ACTIONS = 10;

const MCDONALDS = '/work/mcdonalds-interaction-design';
const ZERO = '/work/zero-my-ai';

/** Each way the app wires useDialogA11y's history options, named after its caller. */
const CALLERS: Record<string, Omit<Config, 'strictMode'>> = {
  'HcdCaseStudy and its lightbox': {
    startPath: '/',
    dialogs: {
      HcdCaseStudy: { options: { historyTag: 'project', historyPath: MCDONALDS, childHistoryTags: ['hcd-visual'] } },
      Lightbox: { options: { historyTag: 'hcd-visual', historyPath: MCDONALDS }, parent: 'HcdCaseStudy', reopensFromHistory: true },
    },
  },
  'ExperienceDetail and FeatureCardModal': {
    startPath: '/',
    dialogs: {
      ExperienceDetail: { options: { historyTag: 'experience', historyPath: '/experience/pg' }, closesChildFirst: true },
      FeatureCardModal: { options: { historyTag: 'feature' }, parent: 'ExperienceDetail' },
    },
  },
  'ZeroProjectDetail opened by its deep link': {
    startPath: ZERO,
    bootOpen: 'ZeroProjectDetail',
    dialogs: { ZeroProjectDetail: { options: { historyTag: 'project', historyPath: ZERO, historyBasePath: '/' } } },
  },
  'ZeroProjectDetail after index.tsx reset the deep link to /': {
    startPath: '/',
    bootOpen: 'ZeroProjectDetail',
    dialogs: { ZeroProjectDetail: { options: { historyTag: 'project', historyPath: ZERO, historyBasePath: '/' } } },
  },
  ProfileModal: {
    startPath: '/',
    dialogs: { ProfileModal: { options: { historyTag: 'profile' } } },
  },
};

describe.each(Object.entries(CALLERS))('%s', (caller, config) => {
  it.each([true, false])(`holds every property in every schedule of up to ${MAX_ACTIONS} actions (StrictMode: %s)`, (strictMode) => {
    const { schedules, violations } = explore({ ...config, strictMode }, MAX_ACTIONS);
    console.log(`${caller}, StrictMode ${strictMode}: ${schedules} schedules, ${violations.length} counterexamples`);
    expect(violations.map(formatViolation).join('\n\n'), 'counterexample').toBe('');
    expect(schedules).toBeGreaterThan(100);
  });
});

interface Finding {
  name: string;
  config: Config;
  lift: Lifts;
  property: string;
  trace: string[];
}

/**
 * Real orders in which the current code breaks a property. The main runs above leave each trigger out (Lifts in
 * dialogHistory.explore.ts); these tests lift it and pin the exact counterexample, so a fix turns them red.
 */
const KNOWN_FINDINGS: Finding[] = [
  {
    name: 'a dialog closed and reopened before its history.back() lands is closed by that back()',
    config: { strictMode: false, ...CALLERS['ZeroProjectDetail after index.tsx reset the deep link to /'], bootOpen: undefined },
    lift: { openWhileBackInFlight: true },
    property: PROPERTIES.closesOnlyOnBack,
    trace: [
      'open ZeroProjectDetail',
      'a pending timer fires: pushState({"modal":"project"}, \'/work/zero-my-ai\')',
      'close ZeroProjectDetail with its Close button or Escape, so React runs its effect cleanup: history.back() (target \'/\')',
      'open ZeroProjectDetail',
      'the browser runs the next traversal: the history.back() lands on \'/\' (state null) and fires popstate; ZeroProjectDetail\'s onClose()',
    ],
  },
  {
    name: 'Back pressed before a just-opened lightbox has pushed its entry leaves that entry behind',
    config: { strictMode: false, ...CALLERS['HcdCaseStudy and its lightbox'] },
    lift: { traversalBeforePush: true },
    property: PROPERTIES.restored,
    trace: [
      'open HcdCaseStudy',
      `a pending timer fires: pushState({"modal":"project"}, '${MCDONALDS}')`,
      'open Lightbox',
      'user presses Back: target \'/\'',
      'the browser runs the next traversal: the user Back lands on \'/\' (state null) and fires popstate; HcdCaseStudy\'s onClose(); Lightbox\'s onClose()',
      `a pending timer fires: pushState({"modal":"hcd-visual"}, '${MCDONALDS}')`,
      'React unmounts HcdCaseStudy, running its effect cleanup',
      'React unmounts Lightbox, running its effect cleanup',
    ],
  },
  {
    name: 'ProfileModal reopened on its own old entry needs two Backs to close',
    config: { strictMode: false, ...CALLERS.ProfileModal },
    lift: { openOnStaleEntry: true },
    property: PROPERTIES.backCloses,
    trace: [
      'open ProfileModal',
      'a pending timer fires: pushState({"modal":"profile"}, \'/\')',
      'close ProfileModal with its Close button or Escape, so React runs its effect cleanup: history.back() (target \'/\')',
      'the browser runs the next traversal: the history.back() lands on \'/\' (state null) and fires popstate',
      'user presses Forward: target \'/\'',
      'the browser runs the next traversal: the user Forward lands on \'/\' (state {"modal":"profile"}) and fires popstate',
      'open ProfileModal',
      'a pending timer fires: pushState({"modal":"profile"}, \'/\')',
      'user presses Back: target \'/\'',
      'the browser runs the next traversal: the user Back lands on \'/\' (state {"modal":"profile"}) and fires popstate',
    ],
  },
  {
    name: 'Forward onto a closed feature card\'s entry closes ExperienceDetail, which lists no childHistoryTags',
    config: { strictMode: false, ...CALLERS['ExperienceDetail and FeatureCardModal'] },
    lift: { forwardOntoUnlistedChildEntry: true },
    property: PROPERTIES.closesOnlyOnBack,
    trace: [
      'open ExperienceDetail',
      'a pending timer fires: pushState({"modal":"experience"}, \'/experience/pg\')',
      'open FeatureCardModal',
      'a pending timer fires: pushState({"modal":"feature"}, \'/experience/pg\')',
      'close FeatureCardModal with its Close button or Escape, so React runs its effect cleanup: history.back() (target \'/experience/pg\')',
      'the browser runs the next traversal: the history.back() lands on \'/experience/pg\' (state {"modal":"experience"}) and fires popstate',
      'user presses Forward: target \'/experience/pg\'',
      'the browser runs the next traversal: the user Forward lands on \'/experience/pg\' (state {"modal":"feature"}) and fires popstate; ExperienceDetail\'s onClose()',
    ],
  },
];

describe('known findings', () => {
  it.each(KNOWN_FINDINGS)('$name', ({ config, lift, property, trace }) => {
    const found = explore(config, 5, lift).violations.find((v) => v.property === property);
    expect(found?.trace, 'No longer reproduces: if the code was fixed, delete this finding and its lift').toEqual(trace);
  });
});
