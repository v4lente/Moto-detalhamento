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
- `client/` — UI and API usage
- `server/` — routes and auth
- `shared/` — domain contracts
- `db/` and `migrations/` — persistence changes

## Key Files
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`server/storage.ts`](../../server/storage.ts#L18)
- [`shared/schema.ts`](../../shared/schema.ts#L1)
- [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L1)

## Key Symbols for This Agent
- `registerRoutes` — [`server/routes.ts`](../../server/routes.ts#L59)
- `DatabaseStorage` — [`server/storage.ts`](../../server/storage.ts#L85)
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
