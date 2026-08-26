# Release gates

## Gate A — synthetic usability preview (current)

- Use only the synthetic listings checked into this project.
- Display the locked/recruitment-closed banner on every workflow page.
- Keep responses in browser memory; do not call research write endpoints.
- Use synthetic accounts only and do not advertise the URL as a study.

## Gate B — authorized pilot

All items below must be complete before changing source constants or runtime
configuration:

1. Written institutional ethics approval/exemption and DPO determination.
2. Frozen protocol, pilot size, hypotheses, exclusion rules, compensation,
   recruitment, duration, and withdrawal deadline.
3. Approved information sheet and consent document with final version and
   SHA-256.
4. Cleared redistribution rights, removal of seller identifiers, and explicit
   image rights; otherwise use a separately approved dataset.
5. Frozen query profiles, candidate pools, practice/repeat/attention tasks,
   participant folds, and task-bundle SHA-256.
6. Support and evaluation query IDs proven disjoint; support IDs zero-padded so
   the 2/5/10/20 budgets remain nested.
7. Institution-approved hosting region, processor terms, database, encryption,
   backups, access roles, retention, deletion, and incident response.
8. Server acceptance tests for gate, consent, workflow, idempotency, withdrawal,
   qrels export, keyboard use, and screen-reader announcements.

## Gate C — confirmatory study

Do not mix redesigned pilot data with confirmatory data. Proceed only after the
pilot go/no-go, variance-based sample-size decision, frozen analysis plan, and a
separate database/environment.
