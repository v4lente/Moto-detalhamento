## Mission
Maintain database integrity and performant queries for ecommerce and scheduling data.

## Responsibilities
- Evolve schemas in `shared/schema.ts` and migrations.
- Review query patterns in `server/storage.ts`.
- Ensure constraints and defaults match business rules.
- Support data migration and seed strategies.

## Best Practices
- Keep schema changes backward compatible when possible.
- Use migrations for durable changes; use `db:push` only for local iteration.
- Validate indexes and foreign keys for frequently queried relations.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `shared/` — Drizzle schema definitions
- `db/` — connection and migration runner
- `migrations/` — SQL migration history

## Key Files
- [`shared/schema.ts`](../../shared/schema.ts#L1)
- [`db/index.ts`](../../db/index.ts#L1)
- [`migrations/`](../../migrations/)
- [`server/storage.ts`](../../server/storage.ts#L18)

## Key Symbols for This Agent
- `products`, `orders`, `appointments` tables — [`shared/schema.ts`](../../shared/schema.ts#L36)
- `runMigrations` — [`db/index.ts`](../../db/index.ts#L83)
- `DatabaseStorage` — [`server/storage.ts`](../../server/storage.ts#L85)

## Documentation Touchpoints
- [`architecture.md`](../docs/architecture.md)
- [`data-flow.md`](../docs/data-flow.md)
- [`security.md`](../docs/security.md)

## Collaboration Checklist
1. Confirm schema changes align with API and UI expectations.
2. Update migrations and verify local apply.
3. Review storage queries for correctness and performance.
4. Document any required data backfills.

## Hand-off Notes
Note any manual migration steps and potential data-impacting changes.
