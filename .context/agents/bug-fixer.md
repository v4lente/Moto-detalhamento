## Mission
Diagnose production and development bugs quickly, with minimal regression risk.

## Responsibilities
- Reproduce issues in UI or API.
- Trace failures through routes, storage, and schemas.
- Implement minimal fixes and verify behavior.
- Document root cause and testing notes.

## Best Practices
- Start from logs in `server/index.ts`.
- Validate input with Zod schemas to catch malformed payloads.
- Add guards to routes or storage methods as needed.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `client/` — UI errors and route flows
- `server/` — API logic and auth
- `shared/` — schema and validation
- `db/` — migration or database issues

## Key Files
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`server/index.ts`](../../server/index.ts#L41)
- [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L1)
- [`shared/schema.ts`](../../shared/schema.ts#L1)

## Key Symbols for This Agent
- `requireAuth`, `requireCustomerAuth` — [`server/routes.ts`](../../server/routes.ts#L34)
- `DatabaseStorage` — [`server/storage.ts`](../../server/storage.ts#L85)
- `checkoutSchema` — [`shared/schema.ts`](../../shared/schema.ts#L186)

## Documentation Touchpoints
- [`testing-strategy.md`](../docs/testing-strategy.md)
- [`data-flow.md`](../docs/data-flow.md)
- [`security.md`](../docs/security.md)

## Collaboration Checklist
1. Capture repro steps and affected endpoints.
2. Identify failing layer (UI, API, storage, DB).
3. Implement fix with minimal surface area.
4. Update docs or add follow-up tests.

## Hand-off Notes
Call out any missing tests or monitoring gaps related to the fix.
