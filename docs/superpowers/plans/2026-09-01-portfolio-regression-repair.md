# Portfolio regression repair

## Scope

Repair the public regressions introduced in the latest release: the desktop project wheel must be the default interactive surface, Git history must not report a shallow-build count as the repository total, TinkerVerse must not use invented journal language, and continuous visual motion must not restart or flicker during normal navigation.

## Steps

1. Add regression checks that require the desktop WebGL wheel by default, truthful history fallback behavior, and removal of the journal labels.
2. Make the wheel opt out only for compact, reduced-motion, or renderer-failure states; keep the fallback accessible.
3. Source Git history from GitHub at build time with a verified local snapshot fallback, never from a shallow clone's incomplete log.
4. Remove the added TinkerVerse journal framing without replacing it with new editorial copy.
5. Remove restart-prone perpetual UI animations while retaining the wheel's deliberate interaction motion.
6. Build and smoke-test desktop, tablet, mobile, reduced-motion, and main-page interaction before pushing.
