## Mission
Diagnose production and development bugs quickly, with minimal regression risk.

## Responsibilities
- Reproduce issues in UI or API.
- Trace failures through routes, storage, and schemas.
- Implement minimal fixes and verify behavior.
- Document root cause and testing notes.

## Best Practices
- Start from logs in `backend/api/index.ts`.
- Validate input with Zod schemas in `shared/contracts/validation.ts`.
- Check `.env` for `SESSION_SECRET` and `DATABASE_URL`.
- Track issues in `work-files/bugs-tracker.md`.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Bugs tracker: [`../../work-files/bugs-tracker.md`](../../work-files/bugs-tracker.md)

## Repository Starting Points
- `frontend/` — UI errors and route flows
- `backend/api/` — API logic and auth
- `shared/contracts/` — validation and types
- `backend/infrastructure/db/` — migration or database issues

## Key Files
- [`backend/api/routes/index.ts`](../../backend/api/routes/index.ts)
- [`backend/api/index.ts`](../../backend/api/index.ts)
- [`frontend/shared/lib/api.ts`](../../frontend/shared/lib/api.ts)
- [`shared/schema.ts`](../../shared/schema.ts)
- [`backend/infrastructure/storage.ts`](../../backend/infrastructure/storage.ts)

## Key Symbols for This Agent
- `requireAuth`, `requireAdmin` — [`backend/api/middleware/auth.ts`](../../backend/api/middleware/auth.ts)
- `DatabaseStorage` — [`backend/infrastructure/storage.ts`](../../backend/infrastructure/storage.ts)
- `checkoutSchema` — [`shared/contracts/validation.ts`](../../shared/contracts/validation.ts)

## Documentation Touchpoints
- [`testing-strategy.md`](../docs/testing-strategy.md)
- [`data-flow.md`](../docs/data-flow.md)
- [`security.md`](../docs/security.md)

## Collaboration Checklist
1. Capture repro steps and affected endpoints.
2. Identify failing layer (UI, API, storage, DB).
3. Implement fix with minimal surface area.
4. Update `work-files/bugs-tracker.md` or add follow-up tests.

## Hand-off Notes
Call out any missing tests or monitoring gaps related to the fix.
