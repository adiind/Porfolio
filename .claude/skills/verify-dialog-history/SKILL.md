---
name: verify-dialog-history
description: Check a change to how dialogs use browser Back/Forward history against an exhaustive schedule check. Use before committing any edit to bindDialogHistory or useDialogA11y in hooks/useDialogA11y.ts, to hooks/dialogHistory.explore.ts or hooks/dialogHistory.test.ts, to a useDialogA11y call that passes historyTag, historyPath, historyBasePath or childHistoryTags, or to code that pushes or pops history while such a dialog is open (HcdCaseStudy's lightbox, ProjectsSection's reopen on Forward). Also use when a dialog closes by itself, needs two Backs, or leaves a stray /work or /experience address.
---

# Verify dialog history

Dialogs on this site own one browser history entry while they are open: browser Back closes them, and closing them
gives the entry back. That protocol lives in `bindDialogHistory` (`hooks/useDialogA11y.ts`). It broke four times, each
time from an ordering mistake that no test reached. `hooks/dialogHistory.test.ts` now runs the real function in every
order of events up to a bound and fails with the exact sequence when a property breaks.

## The properties

Each one, with the harm when it breaks:

1. **A dialog closes only on a user Back.** Never when it opens (StrictMode), never on another dialog's own
   `history.back()`, never on Forward. Harm: a dialog closes the instant it opens, or a page vanishes on Forward.
2. **One Back closes the dialog and lands where it opened.** For a deep link with `historyBasePath`, that is the base
   path. Harm: Back does nothing, or leaves the visitor on a dialog address with no dialog.
3. **A close restores history.** After a close by Close button, Escape or Back, the back stack is what it was before
   the dialog opened, and no dialog entry is left current. Harm: an extra dead Back, a stray address.
4. **A child never closes its parent.** Closing the lightbox or a feature card leaves the parent open and current.
5. **After a Forward reopen, one Back closes.** Forward onto a dialog's old entry, the app reopens it, one Back closes.
6. **An open dialog owns the current entry.** Harm: the address and Back no longer match what is on screen.

## Does my change touch it?

Yes if the diff touches any file in the coverage record below, or:

```sh
git diff --name-only origin/main... | xargs rg -l "historyTag|historyPath|historyBasePath|childHistoryTags|pushState|replaceState|history\.back|popstate" 2>/dev/null
```

lists a file that holds a dialog. A new `useDialogA11y(..., { historyTag })` call counts, and so does a new nested
dialog inside one that has a tag.

## Run it

```sh
npx vitest run hooks/dialogHistory.test.ts
```

About a second. It also runs inside `npm run check`, so inside `npm run build` and the CI build on every push.
Green means every property held in every schedule for every caller wiring, and the four known findings still
reproduce exactly. Each main test logs its schedule count (run with `--reporter=verbose` to see it); a count far below
the ones in the coverage record means the exploration got cut short, which is a problem even when green.

## Read a counterexample

A failure prints the property, what broke, and the shortest sequence that breaks it, in the code's words:

```
Property 1 a dialog closes only on a user Back: HcdCaseStudy closed on a popstate from a dialog's own history.back()
  1. open HcdCaseStudy (StrictMode: effect, cleanup, effect): pushState({"modal":"project"}, '/work/mcdonalds-interaction-design'); history.back() (target '/')
  2. the browser runs the next traversal: the history.back() lands on '/' (state null) and fires popstate; HcdCaseStudy's onClose()
```

Each step is either an outside action (`open X`, `close X with its Close button or Escape`, `user presses Back`,
`user presses Forward`) or a task the page queued (`a pending timer fires`, `the browser runs the next traversal`,
`React unmounts X`, `the app's popstate listener reopens X`). After the colon come the browser calls the real code
made during that step. `target '/'` is the entry a traversal will land on, fixed when it was asked for. Dialog names
are the components in the caller configs at the top of `hooks/dialogHistory.test.ts`.

## Real bug or modelling error?

Walk the steps and answer each question. A "no" means a modelling error: fix the explorer, not the product.

1. Does each browser call in the trace appear in the code you changed, in that order? If the trace shows a call the
   code cannot make, the fake window is wrong.
2. Would a real browser do what the trace says? The fake copies four behaviours, each seen once in Chrome 157 on
   2026-11-24 (record below). Anything else it does, such as a traversal onto the entry already current, throws
   `Unprobed browser behaviour`; probe it in a real browser before modelling it.
3. Would the app do it? The configs copy the callers: `closesChildFirst` is ExperienceDetail's handleTopmostClose,
   `reopensFromHistory` is HcdCaseStudy's restoreVisualFromHistory, and `parent` means the child only opens while the
   parent is open and the parent only closes after it (the lightbox takes Escape first). If a caller changed, change
   its config.
4. Could a person time it? Without a lift, the user acts only once the page has finished reacting (no timer,
   traversal or React work pending). A trace that needs a click inside a 0 ms gap points at a missing lift, not a bug.

If all four hold, it is a real bug. Fix the product code, or, if it is out of scope, record it as a known finding (next
section). Never weaken a property or a config until it passes.

## When the change is intended

- **A new caller wiring** (new tag, new nested dialog, new `historyBasePath` user): add a config to `CALLERS` in
  `hooks/dialogHistory.test.ts` named after the component, with the real options.
- **A fixed finding:** its known-finding test fails with "No longer reproduces". Delete that entry in
  `KNOWN_FINDINGS`, its field in `Lifts`, and the condition that reads it in `World.moves` in
  `hooks/dialogHistory.explore.ts`. Then run the check: the main runs now cover that order.
- **A new real bug you will not fix now:** add a field to `Lifts` named after the trigger, as narrow as the trigger;
  read it in `World.moves`; add a `KNOWN_FINDINGS` entry with the trace the check printed. Then run
  `node scripts/replay-dialog-history-bugs.mjs`: a new lift must not turn a replay green.
- **A deliberate change in behaviour** (say, Forward should no longer reopen): change the property in
  `World.checkQuiescent` or `World.onClose` and say why in the commit message.
- **A trace text changed** but the order is the same: update the trace in `KNOWN_FINDINGS` from the failure output.

## Prove the check still bites

```sh
node scripts/replay-dialog-history-bugs.mjs
```

About 10 seconds. It puts each past bug back into `hooks/useDialogA11y.ts` by exact text replacement, runs the check,
expects red on that bug's property and prints the counterexample, restores the file, and ends with the check green.
Exit code 0 means every replay went red on its property. `DOES NOT APPLY` means the text it replaces changed: rewrite
that replay's edit so it re-creates the same bug in the new code.

| Fix | Bug put back | Property that goes red |
| --- | --- | --- |
| 407961f7 | the pushed entry is recognised by object identity; pushState stores a clone, so close leaks the entry | 3 |
| a933b6f7 | synchronous push; StrictMode's cleanup `history.back()` lands after the remount's push and closes it | 1 |
| feb77f50 | the parent ignores only its own tag; Forward onto the lightbox's entry closes HcdCaseStudy | 1 |
| cb8a6e0d | no adoption; a Forward reopen pushes a second entry and needs two Backs | 5 |
| cb8a6e0d | no base path; a deep link's Back lands on `/work/zero-my-ai` with no dialog | 2 |

## Known findings

Real orders in which the current code breaks a property. The main runs leave each trigger out; the test with the same
name lifts it and pins the trace.

| Lift | What happens |
| --- | --- |
| `openWhileBackInFlight` | A dialog closed and reopened before its `history.back()` lands is closed by that back (property 1). Reachable when one click closes a dialog and opens another with the same tag. |
| `traversalBeforePush` | Back pressed before a just-opened lightbox pushed its entry: both dialogs close, then the late push leaves a lightbox entry current (property 3). Needs Back within the 0 ms push delay. |
| `openOnStaleEntry` | A dialog opened while a stale dialog entry is current (reached with Back/Forward) stacks over it: ProfileModal then needs two Backs (property 2); HcdCaseStudy over a stale lightbox entry reopens the lightbox instead of closing; ExperienceDetail leaves the stale feature entry current. |
| `forwardOntoUnlistedChildEntry` | ExperienceDetail passes no `childHistoryTags`, so Forward onto a closed FeatureCardModal's entry closes ExperienceDetail (property 1). |

## Scope

- **Bound:** every schedule with up to 10 outside actions (open, close, user Back, user Forward), with every order of
  the page's own tasks in between, for 5 caller wirings, with and without StrictMode.
- **Assumptions:** the four browser behaviours below; user Back/Forward behave like a script's `history.back()` and
  `history.forward()` (the probe only called the script ones); the user acts only once the page has finished
  reacting, except where a lift says otherwise; React is not run, so StrictMode's effect, cleanup, effect is one
  step and an unmount after a popstate close is a later task.
- **Not covered:** the focus trap, Escape handling and focus restore in `useDialogA11y`; HcdCaseStudy's lightbox code
  (`components/hcd/HcdCaseStudy.tsx`, a hand copy of the protocol, modelled with `bindDialogHistory` instead);
  ProjectsSection's reopen on Forward (only for some projects); index.tsx's boot reset beyond its effect on the
  address; other history users (the mat's `#experience-` entries, FlipBookApp); real browsers other than Chrome 157.

## Browser record

Checked 2026-11-24 in headless Google Chrome 157.0.8103.79 with a throwaway page that called `history` directly and
reported `location.pathname`, `history.state` and whether popstate fired:

- `history.back()` changes nothing synchronously; the address and state change later, then popstate fires.
- `back()` then `pushState(c)` in the same task lands on the entry before the one current at the `back()` call, with
  `c` kept as a forward entry.
- `forward()` then `pushState(z)` in the same task: no popstate, the address stays at `z` (the target was pruned).
- `history.state === obj` is false right after `pushState(obj)`; the value is equal.

## Coverage record

| File | Covered |
| --- | --- |
| `hooks/useDialogA11y.ts` | `bindDialogHistory`, `DialogHistoryOptions`, `HistoryWindow`, and the hook's call to `bindDialogHistory` |
| `hooks/dialogHistory.explore.ts` | `FakeBrowser`, `World`, `explore`, `PROPERTIES`, `Lifts` |
| `hooks/dialogHistory.test.ts` | `CALLERS`, `KNOWN_FINDINGS`, `MAX_ACTIONS` |
| `scripts/replay-dialog-history-bugs.mjs` | `REPLAYS` |
| Caller wirings copied into `CALLERS` | `components/hcd/HcdCaseStudy.tsx` (`useDialogA11y` call, `restoreVisualFromHistory`), `components/ExperienceDetail.tsx` (`useDialogA11y` calls, `handleTopmostClose`), `components/zero/ZeroProjectDetail.tsx`, `components/hcd/FamilySyncProjectDetail.tsx`, `components/ProfileModal.tsx` |

Schedules per main test at the sync commit: HcdCaseStudy and its lightbox 4666, ExperienceDetail and
FeatureCardModal 2766, each ZeroProjectDetail start 1024, ProfileModal 162.

**Sync commit: 3a770a4e.** The verification describes the covered code as of this commit. Check what changed since:

```sh
git diff 3a770a4e -- hooks/useDialogA11y.ts hooks/dialogHistory.explore.ts hooks/dialogHistory.test.ts scripts/replay-dialog-history-bugs.mjs components/hcd/HcdCaseStudy.tsx components/ExperienceDetail.tsx components/zero/ZeroProjectDetail.tsx components/hcd/FamilySyncProjectDetail.tsx components/ProfileModal.tsx
```

Move the sync commit forward only after you have read that diff, confirmed the configs and the fake window still
describe the code, run the check, and run the replay script with exit code 0.
