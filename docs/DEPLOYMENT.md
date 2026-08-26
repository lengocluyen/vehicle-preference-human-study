# Deployment decision

## GitHub

Use a private GitHub repository for reviewed source code only. Do not commit
participant exports, database files, withdrawal mappings, secrets, backups, or
provider credentials. GitHub Pages is suitable only for a synthetic static
walkthrough; it is not a research-data backend.

## Current private preview

The project uses the Sites/Vinext scaffold and a Cloudflare D1 binding. The
current build can be hosted privately for investigator-only synthetic testing.
Keep access owner-only until an approved recruitment and access plan exists.

## Vercel

A Vercel deployment is allowed now only as a synthetic preview with collection
locked. A real pilot requires an institution-approved persistent database; the
Vercel ephemeral filesystem and browser storage are not acceptable. Before a
live Vercel deployment, document the selected database region, subprocessors,
provider access logs, DPA, retention/deletion behavior, backup expiry, and
withdrawal processing. Replace the D1 storage adapter with the approved
PostgreSQL adapter and rerun the full security/ethics acceptance suite.

## Live configuration contract

The following runtime values are necessary but not sufficient:

- `STUDY_MODE=live`
- `ETHICS_STATUS=READY`
- `ETHICS_APPROVAL_ID`
- `STUDY_DATA_CONTROLLER`
- `STUDY_DEPLOYMENT_ENV=pilot`
- `STUDY_APPROVED_START_UTC` and `STUDY_APPROVED_END_UTC`
- frozen `STUDY_PROTOCOL_VERSION`
- frozen `STUDY_CONSENT_VERSION` and `STUDY_CONSENT_SHA256`
- frozen `STUDY_TASK_BUNDLE_SHA256`
- secret `STUDY_WITHDRAWAL_HMAC_KEY`

The source constants and `LIVE_TASK_BUNDLE` must independently match those
approved values. The application fails closed on missing, placeholder,
expired, or mismatched configuration.
