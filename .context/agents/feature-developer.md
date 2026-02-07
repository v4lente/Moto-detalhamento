## Mission
Implement new product, admin, or scheduling features with minimal regression risk.

## Responsibilities
- Add new UI flows in `client/src/pages` and `client/src/components`.
- Extend API routes and storage methods when needed.
- Update shared schemas for new fields or types.
- Ensure feature works across admin and customer experiences.

## Best Practices
- Start with shared schema updates to define contracts.
- Keep API logic in `server/routes.ts` and data access in `server/storage.ts`.
- Reuse existing UI primitives from `client/src/components/ui`.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `client/` — feature UI
- `server/` — feature APIs
- `shared/` — contracts and validation
- `db/` and `migrations/` — persistence changes

## Key Files
- [`client/src/App.tsx`](../../client/src/App.tsx#L1)
- [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L1)
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`shared/schema.ts`](../../shared/schema.ts#L1)

## Key Symbols for This Agent
- `insertProductSchema` — [`shared/schema.ts`](../../shared/schema.ts#L48)
- `createProduct` — [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L22)
- `createProduct` route — [`server/routes.ts`](../../server/routes.ts#L531)

## Documentation Touchpoints
- [`project-overview.md`](../docs/project-overview.md)
- [`development-workflow.md`](../docs/development-workflow.md)
- [`data-flow.md`](../docs/data-flow.md)

## Collaboration Checklist
1. Confirm requirements and impacted data models.
2. Implement server + client changes in parallel.
3. Validate flows in dev with real data.
4. Update docs and usage notes.

## Hand-off Notes
Note any schema migrations or admin steps needed to enable the feature.
