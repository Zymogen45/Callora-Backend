# Quarantined tests

`jest.quarantine.json` lists Jest suites that were failing when the repository was audited
(stale mocks after refactors, merge leftovers such as undefined variables in test helpers,
specs for routers that are no longer mounted, tests requiring PostgreSQL). They are excluded
from `npm test` and CI so the signal stays trustworthy; the source files are untouched.

- Run them anyway: `JEST_RUN_QUARANTINED=1 npx jest <path>`
- When you fix a suite, delete its line from `jest.quarantine.json`.
