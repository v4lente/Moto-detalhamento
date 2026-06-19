## Mission
Ensure code changes are correct, secure, and consistent with existing patterns.

## Responsibilities
- Review PRs for correctness, security, and maintainability.
- Verify schema and migration alignment.
- Check route authorization and session usage.
- Ensure UI changes match API contracts.

## Best Practices
- Confirm shared schema updates when API payloads change.
- Validate edge cases for orders and appointments.
- Favor clear error handling and consistent responses.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `frontend/` — UI and API usage
- `backend/api/routes/` — routes and auth
- `shared/contracts/` — domain contracts
- `backend/infrastructure/db/` and `migrations/` — persistence

## Key Files
- [`backend/api/routes/index.ts`](../../backend/api/routes/index.ts)
- [`backend/infrastructure/storage.ts`](../../backend/infrastructure/storage.ts)
- [`shared/schema.ts`](../../shared/schema.ts)
- [`shared/contracts/validation.ts`](../../shared/contracts/validation.ts)
- [`frontend/shared/lib/api.ts`](../../frontend/shared/lib/api.ts)

## Key Symbols for This Agent
- `registerAllRoutes` — [`backend/api/routes/index.ts`](../../backend/api/routes/index.ts)
- `DatabaseStorage` — [`backend/infrastructure/storage.ts`](../../backend/infrastructure/storage.ts)
- `CheckoutDialog` — [`client/src/components/checkout-dialog.tsx`](../../client/src/components/checkout-dialog.tsx#L24)

## Documentation Touchpoints
- [`architecture.md`](../docs/architecture.md)
- [`security.md`](../docs/security.md)
- [`testing-strategy.md`](../docs/testing-strategy.md)

## Collaboration Checklist
1. Validate behavior against the PR description and requirements.
2. Ensure auth checks for admin/customer endpoints.
3. Confirm schema changes include migration guidance.
4. Request docs updates if flows change.

## Hand-off Notes
Summarize any risks and required follow-up testing.
