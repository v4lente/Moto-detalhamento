## Mission
Improve code structure without changing behavior across client and server layers.

## Responsibilities
- Simplify large components or route handlers.
- Extract reusable helpers in `client/src/lib`.
- Reduce duplication between admin and customer flows.

## Best Practices
- Refactor in small, testable increments.
- Preserve API contracts and schema compatibility.
- Prefer structural improvements over stylistic churn.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `client/src/pages/` — large feature screens
- `server/routes.ts` — route handlers
- `server/storage.ts` — data access methods
- `shared/schema.ts` — contracts

## Key Files
- [`client/src/pages/admin.tsx`](../../client/src/pages/admin.tsx#L1)
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`server/storage.ts`](../../server/storage.ts#L18)
- [`shared/schema.ts`](../../shared/schema.ts#L1)

## Key Symbols for This Agent
- `DatabaseStorage` — [`server/storage.ts`](../../server/storage.ts#L85)
- `fetchAllOrders` — [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L296)
- `checkoutSchema` — [`shared/schema.ts`](../../shared/schema.ts#L186)

## Documentation Touchpoints
- [`architecture.md`](../docs/architecture.md)
- [`development-workflow.md`](../docs/development-workflow.md)

## Collaboration Checklist
1. Identify a clear refactoring goal and scope.
2. Confirm tests or manual steps to validate behavior.
3. Execute refactor in small commits.
4. Update docs if structure changes.

## Hand-off Notes
Note any follow-up cleanup or deferred improvements.
