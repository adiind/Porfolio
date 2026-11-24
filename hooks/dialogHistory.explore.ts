/**
 * Exhaustive schedule explorer for the dialog history protocol (bindDialogHistory in ./useDialogA11y).
 *
 * It runs the real function against FakeBrowser, a window whose history traversals are queued tasks, and tries every
 * order of the pending tasks (timers, traversals, React work) and of the outside actions (open, close, user Back, user
 * Forward) up to a number of outside actions. Each schedule is replayed from scratch, so no closure is ever copied.
 *
 * Browser behaviour the fake copies, each seen once in Chrome 157 (see .claude/skills/verify-dialog-history):
 *  - a traversal (history.back(), Back, Forward) is asynchronous: the state and address change later, then popstate;
 *  - a traversal's target entry is fixed when it is asked for; a pushState in between does not move it;
 *  - a traversal whose target entry a pushState pruned is dropped, with no popstate;
 *  - pushState and replaceState store a structured clone of the state.
 */
import { bindDialogHistory, type DialogHistoryOptions, type HistoryWindow } from './useDialogA11y';

const SITE = 'https://adidesign.org';

interface Entry { id: number; url: string; state: unknown }
type Origin = 'user Back' | 'user Forward' | 'page';
interface Traversal { targetId: number; origin: Origin }

const pathOf = (url: string) => {
  const u = new URL(url);
  return u.pathname + u.search + u.hash;
};
const describeState = (state: unknown) => (state === null ? 'null' : JSON.stringify(state));
const modalOf = (state: unknown) => (state as { modal?: string } | null)?.modal;
const traversalName = (origin: Origin) => (origin === 'page' ? 'history.back()' : origin);

class FakeBrowser implements HistoryWindow {
  entries: Entry[];
  index = 0;
  timers = new Map<number, () => void>();
  traversals: Traversal[] = [];
  popOrigin: Origin | null = null;
  lastLanding: { entryId: number; origin: Origin } | null = null;
  notes: string[] = [];
  private nextEntryId = 0;
  private nextTimerId = 1;
  private listeners: (() => void)[] = [];

  constructor(startPath: string) {
    this.entries = [{ id: this.nextEntryId++, url: new URL(startPath, SITE).href, state: null }];
  }

  get current() { return this.entries[this.index]; }

  history = (() => {
    const browser = this;
    return {
      get state() { return browser.current.state; },
      pushState(data: unknown, _unused: string, url?: string | URL | null) {
        const entry = { id: browser.nextEntryId++, url: browser.resolve(url), state: structuredClone(data) };
        browser.entries.splice(browser.index + 1, Infinity, entry);
        browser.index++;
        browser.notes.push(`pushState(${describeState(data)}, '${pathOf(entry.url)}')`);
      },
      replaceState(data: unknown, _unused: string, url?: string | URL | null) {
        browser.entries[browser.index] = { id: browser.current.id, url: browser.resolve(url), state: structuredClone(data) };
        browser.notes.push(`replaceState(${describeState(data)}, '${pathOf(browser.current.url)}')`);
      },
      back() {
        browser.notes.push(`history.back() (target '${browser.queueTraversal(-1, 'page')}')`);
      },
    };
  })();

  location = (() => {
    const browser = this;
    return {
      get pathname() { return new URL(browser.current.url).pathname; },
      get href() { return browser.current.url; },
    };
  })();

  addEventListener(_type: 'popstate', listener: () => void) { this.listeners.push(listener); }
  removeEventListener(_type: 'popstate', listener: () => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
  setTimeout(handler: () => void) {
    const id = this.nextTimerId++;
    this.timers.set(id, handler);
    return id;
  }
  clearTimeout(id: number) { this.timers.delete(id); }

  /** Queues a traversal by `delta` and returns its target's path ('none' when there is no entry there). */
  queueTraversal(delta: -1 | 1, origin: Origin): string {
    const target = this.entries[this.index + delta];
    if (!target) return 'none';
    this.traversals.push({ targetId: target.id, origin });
    return pathOf(target.url);
  }

  runTimer() {
    const [id, handler] = this.timers.entries().next().value!;
    this.timers.delete(id);
    handler();
  }

  /** Runs the oldest traversal; returns whether it landed and fired popstate. */
  runTraversal(): boolean {
    const { targetId, origin } = this.traversals.shift()!;
    const target = this.entries.findIndex((e) => e.id === targetId);
    if (target < 0) {
      this.notes.push(`the ${traversalName(origin)} is dropped: a pushState pruned its target`);
      return false;
    }
    if (target === this.index) throw new Error('Unprobed browser behaviour: a traversal to the entry already current');
    this.index = target;
    this.lastLanding = { entryId: targetId, origin };
    this.notes.push(`the ${traversalName(origin)} lands on '${pathOf(this.current.url)}' `
      + `(state ${describeState(this.current.state)}) and fires popstate`);
    this.popOrigin = origin;
    for (const listener of [...this.listeners]) if (this.listeners.includes(listener)) listener();
    this.popOrigin = null;
    return true;
  }

  private resolve(url: string | URL | null | undefined) {
    return url == null ? this.current.url : new URL(url, this.current.url).href;
  }
}

export interface DialogSpec {
  options: DialogHistoryOptions;
  /** The dialog this one opens inside; it opens only while that one is open, which closes only after it. */
  parent?: string;
  /** The caller's onClose closes an open child instead (ExperienceDetail's handleTopmostClose). */
  closesChildFirst?: boolean;
  /** The app reopens this dialog when a popstate lands on its entry (HcdCaseStudy's restoreVisualFromHistory). */
  reopensFromHistory?: boolean;
}

export interface Config {
  /** Parents before children. */
  dialogs: Record<string, DialogSpec>;
  startPath: string;
  /** A dialog that opens at boot, as a deep link /work/<id> does. */
  bootOpen?: string;
  /** React StrictMode: every mount runs effect, cleanup, effect in one go. */
  strictMode: boolean;
}

/**
 * The main run leaves these outside behaviours out; each one, lifted, reproduces a known finding (dialogHistory.test.ts).
 * Without any lift, the user acts only once the page has finished reacting: no timer, traversal or React work pending.
 */
export interface Lifts {
  /** A dialog opens while a history.back() is in flight: one click closes a dialog and opens one with the same tag. */
  openWhileBackInFlight?: boolean;
  /** The user presses Back or Forward before a just-opened dialog's deferred pushState has run. */
  traversalBeforePush?: boolean;
  /**
   * A dialog opens while the current entry is a stale dialog entry it does not adopt: one the user walked onto with
   * Back or Forward that belongs to no open dialog (a closed child's, or its own when it has no historyPath).
   */
  openOnStaleEntry?: boolean;
  /** Forward onto the old entry of a child dialog that its open parent does not list in childHistoryTags. */
  forwardOntoUnlistedChildEntry?: boolean;
}

interface Before {
  url: string;
  backStack: string[];
  /** Opened while the current entry was this dialog's own old entry, as after browser Forward. */
  onOwnOldEntry: boolean;
}

interface Mount { closes: number; unbind: () => void; before?: Before }

type Status = 'closed' | 'open' | 'closing';

interface ReactJob { kind: 'open' | 'unmount'; name: string }

interface Expectation { kind: 'back' | 'close'; dialog: string; mount: Mount; parentMount?: Mount }

export interface Violation { property: string; message: string; trace: string[] }

interface Move { label: string; apply: () => void; outside: boolean }

export const PROPERTIES = {
  closesOnlyOnBack: '1 a dialog closes only on a user Back',
  backCloses: '2 one Back closes the dialog and lands before it',
  restored: '3 history is restored after a close',
  childKeepsParent: '4 a child never closes its parent',
  forwardReopen: '5 after a Forward reopen, one Back closes',
  ownsEntry: '6 an open dialog owns the current entry',
} as const;

class World {
  browser: FakeBrowser;
  status: Record<string, Status> = {};
  mounts: Record<string, Mount | undefined> = {};
  react: ReactJob[] = [];
  violation?: { property: string; message: string };
  expectation?: Expectation;
  actionsTaken = 0;

  constructor(readonly config: Config, readonly lifts: Lifts) {
    this.browser = new FakeBrowser(config.startPath);
    for (const name of this.names) this.status[name] = 'closed';
  }

  get names() { return Object.keys(this.config.dialogs); }
  get quiescent() { return !this.browser.timers.size && !this.browser.traversals.length && !this.react.length; }
  childOf(name: string) { return this.names.find((n) => this.config.dialogs[n].parent === name); }
  isMounted(name: string) { return this.status[name] !== 'closed'; }
  fail(property: string, message: string) { this.violation ??= { property, message }; }

  /** The open dialogs, outermost first. */
  openStack() { return this.names.filter((n) => this.status[n] === 'open'); }

  ownsCurrentEntry(name: string) {
    const { historyTag, historyPath } = this.config.dialogs[name].options;
    return modalOf(this.browser.current.state) === historyTag
      && (!historyPath || this.browser.location.pathname === historyPath);
  }

  backStack(upTo = this.browser.index) {
    return this.browser.entries.slice(0, upTo + 1).map((e) => `${e.id} ${pathOf(e.url)} ${describeState(e.state)}`);
  }

  /** Where one Back should land once this dialog is open, and the back stack a close should leave. */
  before(name: string): Before {
    const { historyTag, historyPath, historyBasePath } = this.config.dialogs[name].options;
    const { browser } = this;
    if (historyPath && this.ownsCurrentEntry(name)) {
      return { url: browser.entries[browser.index - 1].url, backStack: this.backStack(browser.index - 1), onOwnOldEntry: true };
    }
    if (historyPath && historyBasePath && browser.location.pathname.replace(/\/$/, '') === historyPath
      && modalOf(browser.current.state) !== historyTag) {
      const url = new URL(historyBasePath, browser.current.url).href;
      return { url, backStack: [...this.backStack(browser.index - 1), `${browser.current.id} ${pathOf(url)} null`], onOwnOldEntry: false };
    }
    return { url: browser.current.url, backStack: this.backStack(), onOwnOldEntry: false };
  }

  open(name: string) {
    const { options } = this.config.dialogs[name];
    const mount: Mount = { closes: 0, unbind: () => {}, before: this.quiescent ? this.before(name) : undefined };
    const onClose = () => this.onClose(name, mount);
    mount.unbind = bindDialogHistory(this.browser, options, onClose);
    if (this.config.strictMode) {
      mount.unbind();
      mount.unbind = bindDialogHistory(this.browser, options, onClose);
    }
    this.mounts[name] = mount;
    this.status[name] = 'open';
  }

  onClose(name: string, mount: Mount) {
    const { browser } = this;
    browser.notes.push(`${name}'s onClose()`);
    mount.closes++;
    if (browser.popOrigin !== 'user Back') {
      this.fail(PROPERTIES.closesOnlyOnBack, browser.popOrigin
        ? `${name} closed on a popstate from ${browser.popOrigin === 'page' ? 'a dialog\'s own history.back()' : 'a user Forward'}`
        : `${name} closed outside any popstate`);
    }
    if (mount.closes > 1) this.fail(PROPERTIES.closesOnlyOnBack, `${name}'s onClose ran twice for one mount`);
    const child = this.childOf(name);
    const target = this.config.dialogs[name].closesChildFirst && child && this.status[child] === 'open' ? child : name;
    if (this.status[target] !== 'open') return;
    this.status[target] = 'closing';
    this.react.push({ kind: 'unmount', name: target });
  }

  /** React unmounts a dialog: its effect cleanup runs, then its child's (React's top-down passive unmount order). */
  unmount(name: string) {
    if (!this.isMounted(name)) return;
    this.mounts[name]!.unbind();
    this.status[name] = 'closed';
    const child = this.childOf(name);
    if (child) this.unmount(child);
  }

  /** The app's own popstate listeners that reopen a dialog whose entry the browser just showed. */
  reopenFromHistory() {
    for (const name of this.names) {
      const { parent, reopensFromHistory } = this.config.dialogs[name];
      if (reopensFromHistory && this.status[name] === 'closed' && (!parent || this.status[parent] === 'open')
        && this.ownsCurrentEntry(name) && !this.react.some((job) => job.name === name)) {
        this.react.push({ kind: 'open', name });
      }
    }
  }

  settledTop(): string | undefined {
    const stack = this.openStack();
    const top = stack[stack.length - 1];
    if (!top || !this.quiescent || this.mounts[top]!.closes || !this.ownsCurrentEntry(top)) return undefined;
    return top;
  }

  expect(kind: Expectation['kind'], dialog: string | undefined) {
    if (!dialog) return;
    const parent = this.config.dialogs[dialog].parent;
    this.expectation = { kind, dialog, mount: this.mounts[dialog]!, parentMount: parent ? this.mounts[parent] : undefined };
  }

  /** The user walked onto the current entry, a dialog entry that no open dialog owns and that `name` would not adopt. */
  staleEntryFor(name: string) {
    const { browser } = this;
    const modal = modalOf(browser.current.state);
    if (!modal || !this.walkedOnto() || this.openStack().some((n) => this.config.dialogs[n].options.historyTag === modal)) return false;
    return !(this.config.dialogs[name].options.historyPath && this.ownsCurrentEntry(name));
  }

  /** The current entry is where the user's last Back or Forward landed. */
  walkedOnto() {
    const { lastLanding, current } = this.browser;
    return lastLanding?.entryId === current.id && lastLanding.origin !== 'page';
  }

  forwardOntoUnlistedChild() {
    const target = modalOf(this.browser.entries[this.browser.index + 1]?.state);
    return this.names.some((name) => {
      const { options, parent } = this.config.dialogs[name];
      return options.historyTag === target && parent && this.status[parent] === 'open'
        && !this.config.dialogs[parent].options.childHistoryTags?.includes(target);
    });
  }

  moves(maxActions: number): Move[] {
    const { browser, lifts } = this;
    const moves: Move[] = [];
    if (browser.timers.size) moves.push({ label: 'a pending timer fires', apply: () => browser.runTimer(), outside: false });
    if (browser.traversals.length) {
      moves.push({
        label: 'the browser runs the next traversal',
        apply: () => { if (browser.runTraversal()) this.reopenFromHistory(); },
        outside: false,
      });
    }
    if (this.react.length) {
      const job = this.react[0];
      moves.push(job.kind === 'unmount'
        ? { label: `React unmounts ${job.name}, running its effect cleanup`, apply: () => { this.react.shift(); this.unmount(job.name); }, outside: false }
        : { label: `the app's popstate listener reopens ${job.name}`, apply: () => { this.react.shift(); this.open(job.name); }, outside: false });
    }
    if (this.actionsTaken >= maxActions) return moves;

    const idle = this.quiescent;
    const canOpen = idle || (lifts.openWhileBackInFlight && browser.traversals.length > 0);
    const canTraverse = idle || (lifts.traversalBeforePush && browser.timers.size > 0 && !browser.traversals.length);
    for (const name of this.names) {
      const { parent } = this.config.dialogs[name];
      if (canOpen && this.status[name] === 'closed' && (!parent || this.status[parent] === 'open')
        && (!this.staleEntryFor(name) || lifts.openOnStaleEntry)) {
        moves.push({
          label: `open ${name}${this.config.strictMode ? ' (StrictMode: effect, cleanup, effect)' : ''}`,
          apply: () => this.open(name),
          outside: true,
        });
      }
      const child = this.childOf(name);
      if (idle && this.status[name] === 'open' && (!child || this.status[child] === 'closed')) {
        moves.push({
          label: `close ${name} with its Close button or Escape, so React runs its effect cleanup`,
          apply: () => { this.expect('close', this.settledTop() === name ? name : undefined); this.unmount(name); },
          outside: true,
        });
      }
    }
    if (canTraverse && browser.index > 0) {
      moves.push({
        label: 'user presses Back',
        apply: () => {
          this.expect('back', this.settledTop());
          browser.notes.push(`target '${browser.queueTraversal(-1, 'user Back')}'`);
        },
        outside: true,
      });
    }
    if (canTraverse && browser.index < browser.entries.length - 1
      && (!this.forwardOntoUnlistedChild() || lifts.forwardOntoUnlistedChildEntry)) {
      moves.push({
        label: 'user presses Forward',
        apply: () => { browser.notes.push(`target '${browser.queueTraversal(1, 'user Forward')}'`); },
        outside: true,
      });
    }
    return moves;
  }

  checkQuiescent() {
    const { browser } = this;
    const stack = this.openStack();
    const top = stack[stack.length - 1];
    // The user may walk Back or Forward onto a dialog's old entry; the app reopens only some dialogs there.
    if (!this.walkedOnto()) {
      if (top && !this.ownsCurrentEntry(top)) {
        this.fail(PROPERTIES.ownsEntry,
          `${top} is open but the current entry is '${pathOf(browser.current.url)}' (state ${describeState(browser.current.state)})`);
      }
      if (stack.length === 2 && modalOf(browser.entries[browser.index - 1]?.state) !== this.config.dialogs[stack[0]].options.historyTag) {
        this.fail(PROPERTIES.ownsEntry, `${stack[1]} is open over ${stack[0]}, but the entry under it is not ${stack[0]}'s`);
      }
      if (!stack.length && modalOf(browser.current.state)) {
        this.fail(PROPERTIES.restored, `no dialog is open, yet the current entry is the dialog entry `
          + `'${pathOf(browser.current.url)}' (state ${describeState(browser.current.state)})`);
      }
    }

    const expectation = this.expectation;
    this.expectation = undefined;
    if (!expectation) return;
    const { kind, dialog, mount, parentMount } = expectation;
    const { before } = mount;
    const closeProperty = kind === 'close' ? PROPERTIES.restored
      : before?.onOwnOldEntry ? PROPERTIES.forwardReopen : PROPERTIES.backCloses;
    if (kind === 'back' && mount.closes !== 1) this.fail(closeProperty, `after one Back, ${dialog}'s onClose ran ${mount.closes} times`);
    if (this.isMounted(dialog) && this.mounts[dialog] === mount) this.fail(closeProperty, `${dialog} is still open`);
    const { parent } = this.config.dialogs[dialog];
    if (parent) {
      if (this.status[parent] !== 'open' || this.mounts[parent] !== parentMount || parentMount?.closes) {
        this.fail(PROPERTIES.childKeepsParent, `${parent} closed when its child ${dialog} closed`);
      } else if (!this.ownsCurrentEntry(parent)) {
        this.fail(PROPERTIES.childKeepsParent, `${parent} stayed open but no longer owns the current entry`);
      }
    }
    if (!before) return;
    if (browser.current.url !== before.url) {
      this.fail(closeProperty, `the address is '${pathOf(browser.current.url)}', not '${pathOf(before.url)}' as before ${dialog} opened`);
    } else if (this.backStack().join('\n') !== before.backStack.join('\n')) {
      this.fail(PROPERTIES.restored, `the back stack is [${this.backStack().join(', ')}], `
        + `not [${before.backStack.join(', ')}] as before ${dialog} opened`);
    }
  }
}

export interface Exploration { schedules: number; violations: Violation[] }

/** Tries every schedule with at most `maxActions` outside actions; returns the shortest counterexample per property. */
export function explore(config: Config, maxActions: number, lifts: Lifts = {}): Exploration {
  const shortest = new Map<string, Violation>();
  let prefix: number[] = [];
  let schedules = 0;
  for (;;) {
    const world = new World(config, lifts);
    const trace: string[] = [];
    if (config.bootOpen) {
      world.open(config.bootOpen);
      trace.push(`the page boots at '${config.startPath}' and opens ${config.bootOpen}`
        + (world.browser.notes.length ? `: ${world.browser.notes.join('; ')}` : ''));
    }
    const taken: number[] = [];
    const counts: number[] = [];
    for (let step = 0; ; step++) {
      const moves = world.moves(maxActions);
      if (!moves.length) break;
      const choice = step < prefix.length ? prefix[step] : 0;
      taken.push(choice);
      counts.push(moves.length);
      const move = moves[choice];
      if (move.outside) {
        world.actionsTaken++;
        world.expectation = undefined;
      }
      world.browser.notes = [];
      move.apply();
      trace.push(world.browser.notes.length ? `${move.label}: ${world.browser.notes.join('; ')}` : move.label);
      if (!world.violation && world.quiescent) world.checkQuiescent();
      if (world.violation) {
        const { property, message } = world.violation;
        const known = shortest.get(property);
        if (!known || trace.length < known.trace.length) shortest.set(property, { property, message, trace: [...trace] });
        break;
      }
    }
    schedules++;
    let i = taken.length - 1;
    while (i >= 0 && taken[i] + 1 >= counts[i]) i--;
    if (i < 0) break;
    prefix = [...taken.slice(0, i), taken[i] + 1];
  }
  return { schedules, violations: [...shortest.values()].sort((a, b) => a.property.localeCompare(b.property)) };
}

export function formatViolation({ property, message, trace }: Violation) {
  return [`Property ${property}: ${message}`, ...trace.map((step, i) => `  ${i + 1}. ${step}`)].join('\n');
}
