---
type: skill
name: Bug Investigation
description: Systematic bug investigation and root cause analysis
skillSlug: bug-investigation
phases: [E, V]
generated: 2026-02-06
status: filled
scaffoldVersion: "2.0.0"
---

# Bug Investigation

## When to use

Any reported bug, failed baseline test, or unexpected 500 in API/UI.

## Project map (current paths)

| Layer | Path |
|-------|------|
| Frontend | `frontend/features/`, `frontend/shared/lib/api.ts` |
| API routes | `backend/api/routes/*.routes.ts` |
| Services | `backend/services/*.service.ts` |
| Storage | `backend/infrastructure/storage.ts` |
| Contracts | `shared/contracts/validation.ts` |
| Schema | `shared/schema.ts`, `migrations/` |

See also `AGENTS.md` and `work-files/bugs-tracker.md`.

## Workflow

1. **Reproduce** — `npm run dev` (port 5000) or curl the failing endpoint.
2. **Identify layer** — UI error vs API 4xx/5xx vs DB/migration.
3. **Trace** — Follow request: route → service → storage → schema. Check Zod validation in `shared/contracts/`.
4. **Check env** — `SESSION_SECRET`, `DATABASE_URL` in `.env` (copy from `.env.example`).
5. **Minimal fix** — smallest change that fixes root cause; no drive-by refactors.
6. **Validate** — `npm run check`, `npm run build && npm run test`, manual flow if needed.
7. **Document** — update `work-files/bugs-tracker.md` with RCA.

## Baseline commands

```bash
npm run check
npm run build
npm run test          # requires: npx playwright install chromium (first time)
node scripts/smoke-test-api.mjs   # requires running server + DATABASE_URL
```

## Handoff

- UI → frontend-specialist agent
- API/storage → backend-specialist agent
- Schema/migrations → database-specialist agent
- Auth/Stripe/uploads → security-auditor + `/review-security`
