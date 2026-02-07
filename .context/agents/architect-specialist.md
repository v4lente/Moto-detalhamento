## Mission
Guide architecture decisions that keep the monolith maintainable while supporting ecommerce and service scheduling growth.

## Responsibilities
- Map system boundaries across client, server, and shared schema layers.
- Review changes that affect routing, persistence, or data contracts.
- Propose modularization or scaling strategies when requirements grow.
- Keep architecture documentation aligned with code changes.

## Best Practices
- Keep `shared/schema.ts` the source of truth for contracts.
- Validate new flows end-to-end (client API -> server route -> storage).
- Prefer small, reversible architecture changes over large rewrites.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `client/` — UI routes and components
- `server/` — API routes and integrations
- `shared/` — schemas and validation contracts
- `db/` and `migrations/` — data storage lifecycle

## Key Files
- [`server/index.ts`](../../server/index.ts#L1) (bootstrap)
- [`server/routes.ts`](../../server/routes.ts#L1) (API)
- [`server/storage.ts`](../../server/storage.ts#L18) (data access)
- [`shared/schema.ts`](../../shared/schema.ts#L1) (contracts)
- [`client/src/App.tsx`](../../client/src/App.tsx#L1) (routing)

## Key Symbols for This Agent
- `DatabaseStorage` — [`server/storage.ts`](../../server/storage.ts#L85)
- `IStorage` — [`server/storage.ts`](../../server/storage.ts#L18)
- `registerRoutes` — [`server/routes.ts`](../../server/routes.ts#L59)
- `CheckoutData` — [`shared/schema.ts`](../../shared/schema.ts#L186)

## Documentation Touchpoints
- [`architecture.md`](../docs/architecture.md)
- [`data-flow.md`](../docs/data-flow.md)
- [`project-overview.md`](../docs/project-overview.md)

## Collaboration Checklist
1. Confirm scope and assumptions before proposing architecture changes.
2. Review impacted layers (client, server, shared schemas).
3. Update architecture docs when interfaces change.
4. Capture follow-ups and risks for the next reviewer.

## Hand-off Notes
Summarize any architectural constraints (sessions, migrations, storage) and highlight required follow-up work.
