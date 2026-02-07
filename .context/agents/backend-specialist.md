## Mission
Deliver reliable API and storage behavior for ecommerce, scheduling, and admin flows.

## Responsibilities
- Implement or modify Express routes and middleware.
- Maintain auth/session behavior for admin and customer accounts.
- Update Drizzle schema and migrations when data models change.
- Integrate external services (email, object storage).

## Best Practices
- Validate inputs with Zod schemas from `shared/schema.ts`.
- Return consistent error payloads for client handling.
- Keep storage operations centralized in `DatabaseStorage`.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `server/` — routes, middleware, integrations
- `db/` and `migrations/` — schema migration lifecycle
- `shared/` — domain schema and validation

## Key Files
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`server/index.ts`](../../server/index.ts#L1)
- [`server/storage.ts`](../../server/storage.ts#L18)
- [`shared/schema.ts`](../../shared/schema.ts#L1)
- [`db/index.ts`](../../db/index.ts#L1)

## Key Symbols for This Agent
- `registerRoutes` — [`server/routes.ts`](../../server/routes.ts#L59)
- `DatabaseStorage` — [`server/storage.ts`](../../server/storage.ts#L85)
- `runMigrations` — [`db/index.ts`](../../db/index.ts#L83)
- `createAppointmentSchema` — [`shared/schema.ts`](../../shared/schema.ts#L301)

## Documentation Touchpoints
- [`data-flow.md`](../docs/data-flow.md)
- [`security.md`](../docs/security.md)
- [`architecture.md`](../docs/architecture.md)

## Collaboration Checklist
1. Confirm new routes align with shared schemas.
2. Add or adjust storage methods for new entities.
3. Validate auth requirements on sensitive endpoints.
4. Update docs when API behavior changes.

## Hand-off Notes
Note any new environment variables or migration steps needed by downstream work.
