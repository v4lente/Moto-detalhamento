## Testing Strategy

Quality is enforced through TypeScript checking, Playwright smoke/E2E tests, API smoke script, and manual verification of key flows.

## Test Types

- **E2E / smoke**: Playwright in `tests/` — build artifacts, server startup, home page, API health, degraded-mode API behavior.
- **API smoke**: `node scripts/smoke-test-api.mjs` — health, products, settings (requires running server + `DATABASE_URL`).
- **Unit**: Not configured; recommended Vitest for `*.test.ts` / `*.test.tsx`.
- **Integration**: Manual API checks against `/api/*` routes.

## Running Tests

```bash
# First-time setup (Playwright browsers)
npx playwright install chromium

# Typecheck
npm run check

# Full CI-like gate
npm run build && npm run test

# API smoke (server must be running)
node scripts/smoke-test-api.mjs
```

Copy `.env.example` to `.env` and set at least `SESSION_SECRET` and `DATABASE_URL` before full API/manual testing.

## Test Files

| File | Purpose |
|------|---------|
| `tests/build.spec.ts` | Build output, static serving, health response shape |
| `tests/api-degraded.spec.ts` | Behavior when `DATABASE_URL` is missing |
| `tests/admin-requests.spec.ts` | Admin dashboard request budget (e.g. no N+1 variation fetches on load) |

Manual checks recommended after catalog UX changes: `/produtos` (busca, categoria, ordenação, paginação) and `/admin` → Produtos (busca, status, ordenação, paginação).

## Quality Gates

- TypeScript must pass (`npm run check`).
- `npm run build && npm run test` before PRs.
- Track bugs and regressions in `work-files/bugs-tracker.md`.

## Troubleshooting

- **Playwright browser missing**: run `npx playwright install chromium`.
- **Server won't start**: ensure `.env` has `SESSION_SECRET` (required in production bundle).
- **API 503/500**: configure `DATABASE_URL` and run `npm run db:setup`.
- **Node version**: package.json requires Node `>=20.19.0`; older versions may lack `--env-file-if-exists` (scripts use `load-env-if-exists.mjs` instead).

See [`development-workflow.md`](./development-workflow.md) for daily practices.
