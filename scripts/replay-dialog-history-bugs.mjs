#!/usr/bin/env node
/**
 * Puts each past dialog-history bug back into hooks/useDialogA11y.ts, one at a time, runs hooks/dialogHistory.test.ts,
 * and expects it to fail on the property that bug broke. The file is restored after every replay, then the check must
 * pass again. Exit code 1 if a replay no longer applies, stays green, or fails on another property.
 *
 *   node scripts/replay-dialog-history-bugs.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILE = 'hooks/useDialogA11y.ts';
const TEST = 'hooks/dialogHistory.test.ts';

const REPLAYS = [
  {
    fix: '407961f7',
    bug: 'the entry the dialog pushed is recognised by object identity, but pushState stores a clone',
    property: '3 history is restored after a close',
    edits: [
      ['  let pushed = false;\n', '  let pushed = false;\n  const entry = { modal: tag };\n'],
      ["win.history.pushState({ modal: tag }, '', historyPath ?? win.location.href);", "win.history.pushState(entry, '', historyPath ?? win.location.href);"],
      ['if (pushed && !consumed && win.history.state?.modal === tag) {', 'if (pushed && !consumed && win.history.state === entry) {'],
    ],
  },
  {
    fix: 'a933b6f7',
    bug: 'the dialog pushes its entry synchronously, so StrictMode\'s cleanup issues a history.back()',
    property: '1 a dialog closes only on a user Back',
    edits: [
      ['const pushTimer = win.setTimeout(() => {', 'const pushTimer = ((push: () => void, _delay: number) => { push(); return 0; })(() => {'],
    ],
  },
  {
    fix: 'a933b6f7',
    bug: 'the dialog does not ignore a popstate that lands on its own entry, so its child\'s close closes it too',
    property: '4 a child never closes its parent',
    edits: [
      ['if (win.history.state?.modal === tag || childHistoryTags?.includes(win.history.state?.modal)) return;', 'if (childHistoryTags?.includes(win.history.state?.modal)) return;'],
    ],
  },
  {
    fix: 'a933b6f7',
    bug: 'the cleanup leaves its popstate listener behind, so StrictMode\'s first effect still hears popstate',
    property: '1 a dialog closes only on a user Back',
    edits: [
      ["    win.removeEventListener('popstate', handlePopState);\n", ''],
    ],
  },
  {
    fix: 'feb77f50',
    bug: 'the parent does not ignore a popstate that lands on its child\'s entry',
    property: '1 a dialog closes only on a user Back',
    edits: [
      ['if (win.history.state?.modal === tag || childHistoryTags?.includes(win.history.state?.modal)) return;', 'if (win.history.state?.modal === tag) return;'],
    ],
  },
  {
    fix: 'cb8a6e0d',
    bug: 'a dialog reopened by Forward on its old entry pushes a second entry instead of adopting it',
    property: '5 after a Forward reopen, one Back closes',
    edits: [
      ['    if (historyPath && win.history.state?.modal === tag && win.location.pathname === historyPath) return;\n', ''],
    ],
  },
  {
    fix: 'cb8a6e0d',
    bug: 'a deep link\'s dialog pushes over its own address, so Back lands on the dialog\'s address with no dialog',
    property: '2 one Back closes the dialog and lands before it',
    edits: [
      [
        "    if (historyBasePath && historyPath\n      && win.location.pathname.replace(/\\/$/, '') === historyPath\n      && win.history.state?.modal !== tag) {\n      win.history.replaceState(null, '', historyBasePath);\n    }\n",
        '',
      ],
    ],
  },
];

const runCheck = () => spawnSync('npx', ['vitest', 'run', TEST], { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } });

/** The failing tests and, from the assertion diffs, the first counterexample on `property`. */
const readFailure = (output, property) => {
  const lines = output.split('\n');
  const failing = [...new Set(lines.filter((l) => /^\s*FAIL\s/.test(l)).map((l) => l.trim().replace(/^FAIL\s+/, '')))];
  const start = lines.findIndex((l) => l.startsWith(`+ Property ${property}`));
  const counterexample = [];
  for (let i = start; start >= 0 && i < lines.length && lines[i].startsWith('+ '); i++) counterexample.push(lines[i].slice(2));
  return { failing, counterexample };
};

const original = readFileSync(FILE, 'utf8');
const restore = () => writeFileSync(FILE, original);
process.on('SIGINT', () => { restore(); process.exit(130); });

let ok = true;
try {
  for (const { fix, bug, property, edits } of REPLAYS) {
    console.log(`\n=== ${fix}: ${bug}`);
    let mutated = original;
    const missing = edits.filter(([from]) => mutated.split(from).length !== 2);
    if (missing.length) {
      console.log(`DOES NOT APPLY: ${FILE} no longer contains exactly one copy of:\n${missing.map(([from]) => `  ${JSON.stringify(from)}`).join('\n')}`);
      ok = false;
      continue;
    }
    for (const [from, to] of edits) mutated = mutated.replace(from, to);
    writeFileSync(FILE, mutated);
    const result = runCheck();
    restore();
    const { failing, counterexample } = readFailure(result.stdout + result.stderr, property);
    const red = result.status !== 0;
    const onProperty = counterexample.length > 0;
    console.log(red ? `RED (expected) on ${failing.length} test(s):` : 'GREEN: the check missed this bug');
    for (const line of failing) console.log(`  ${line}`);
    if (counterexample.length) console.log(`Counterexample:\n${counterexample.map((l) => `  ${l}`).join('\n')}`);
    if (!red || !onProperty) {
      console.log(`FAILED REPLAY: expected a counterexample on property ${property}`);
      ok = false;
    }
  }
} finally {
  restore();
}

const after = runCheck();
console.log(`\n=== restored ${FILE}: the check is ${after.status === 0 ? 'green' : 'RED'}`);
if (after.status !== 0) ok = false;
process.exit(ok ? 0 : 1);
