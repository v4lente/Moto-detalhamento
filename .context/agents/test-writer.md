## Mission
Improve confidence in catalog, checkout, and scheduling flows by adding reliable tests.

## Responsibilities
- Add unit tests for shared schema validation.
- Add integration tests for key API routes.
- Recommend a test framework and wiring if needed.

## Best Practices
- Favor deterministic tests with clear fixtures.
- Keep tests close to the files they validate.
- Document any required setup (DATABASE_URL, seed data).

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `shared/contracts/` — validation targets
- `backend/api/routes/` — route handlers
- `backend/infrastructure/storage.ts` — data layer
- `frontend/` — UI and API usage
- `tests/` — Playwright specs

## Key Files
- [`shared/contracts/validation.ts`](../../shared/contracts/validation.ts)
- [`backend/api/routes/`](../../backend/api/routes/)
- [`backend/infrastructure/storage.ts`](../../backend/infrastructure/storage.ts)
- [`frontend/shared/lib/api.ts`](../../frontend/shared/lib/api.ts)
- [`tests/build.spec.ts`](../../tests/build.spec.ts)

## Key Symbols for This Agent
- `checkoutSchema` — [`shared/contracts/validation.ts`](../../shared/contracts/validation.ts)
- `registerAllRoutes` — [`backend/api/routes/index.ts`](../../backend/api/routes/index.ts)

## Documentation Touchpoints
- [`testing-strategy.md`](../docs/testing-strategy.md)
- [`development-workflow.md`](../docs/development-workflow.md)

## Collaboration Checklist
1. Pick a test framework (Jest or Vitest) and add scripts.
2. Implement tests for core routes and validation.
3. Verify tests in CI or local workflow.
4. Update testing docs with commands and coverage goals.

## Hand-off Notes
Note any missing test infrastructure or environments needed for CI.
