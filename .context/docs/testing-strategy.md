## Testing Strategy
Automated tests are not currently wired into the repository. Quality is enforced primarily through type checking and manual verification of key flows (catalog, checkout, admin, scheduling).

## Test Types
- **Unit**: Not configured; recommended Jest or Vitest for `*.test.ts` and `*.test.tsx`.
- **Integration**: Manual API checks against `/api/*` routes.
- **E2E**: Manual UI verification; no Playwright/Cypress configuration detected.

## Running Tests
- Typecheck: `npm run check`
- Test runner: not configured (add `npm run test` when Jest/Vitest is introduced)
- Coverage: not configured

## Quality Gates
- TypeScript must pass (`npm run check`).
- Manual smoke test for `/`, `/produtos`, and `/admin` flows.

## Troubleshooting
If tests are added, ensure the dev server uses the same `DATABASE_URL` as local runs to prevent drift in integration behavior.

See [`development-workflow.md`](./development-workflow.md) for daily practices.
