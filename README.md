# Vehicle Preference Human Study

This is an ethics-gated web interface for the planned vehicle preference study.
The checked-in configuration is deliberately limited to a synthetic
demonstration. It cannot recruit participants or write research judgments.

## What is implemented

- neutral study information and a demonstration acknowledgment;
- a structured preference inventory without free-text personal history;
- eight worked practice cases and an identity-versus-suitability check;
- randomized A/B support choices with a valid `Cannot judge` path;
- disjoint 0–3 evaluation tasks with fixed scale anchors;
- controlled reason codes and a short burden/usability questionnaire;
- in-memory demonstration events and downloads using the exact evaluator TSV
  contracts;
- a server-side, fail-closed ethics gate;
- a D1 schema for pseudonymous sessions, server-owned assignments, append-only
  events, idempotency, and withdrawal quarantine requests;
- no external analytics, fonts, listing images, seller data, or model outputs.

## Local synthetic preview

Use Node.js 22.13 or later:

```bash
npm install
npm run dev
```

Then open the local URL printed by the development server. Run all checks with:

```bash
npm run check
```

The demonstration keeps responses in React memory only. Closing or resetting
the page removes them. Downloaded `demo_*.tsv` files are synthetic test
artifacts and are ignored by Git.

## Release status

`study/ETHICS_READINESS_CHECKLIST.md` in the parent research repository is the
canonical operational checklist. The current protocol is a draft, consent text
contains placeholders, the real task bundle does not exist, and vehicle
redistribution rights are unresolved. Therefore `lib/server/study-gate.ts`
contains draft/synthetic source constants that make live collection impossible.

Do not weaken this guard by setting only `ETHICS_STATUS=READY`. Activation
requires a reviewed source change that freezes the approved protocol, consent
document hash, real task-bundle hash, collection window, controller, deployment
environment, and withdrawal secret.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and
[docs/RELEASE_GATES.md](docs/RELEASE_GATES.md).
