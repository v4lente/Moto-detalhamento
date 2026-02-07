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
- `shared/` — schema validation targets
- `server/` — route handlers and storage
- `client/` — UI and API usage

## Key Files
- [`shared/schema.ts`](../../shared/schema.ts#L1)
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`server/storage.ts`](../../server/storage.ts#L18)
- [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L1)

## Key Symbols for This Agent
- `checkoutSchema` — [`shared/schema.ts`](../../shared/schema.ts#L186)
- `createAppointmentSchema` — [`shared/schema.ts`](../../shared/schema.ts#L301)
- `registerRoutes` — [`server/routes.ts`](../../server/routes.ts#L59)

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
