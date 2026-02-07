## Mission
Keep documentation aligned with the evolving ecommerce and scheduling features.

## Responsibilities
- Update docs when routes, schemas, or workflows change.
- Summarize new features and admin flows in `README.md`.
- Keep `.context/docs` maps accurate and searchable.
- Capture sample commands and outputs when behavior changes.

## Best Practices
- Prefer concise, actionable steps over long narratives.
- Link to source files for implementation details.
- Keep terminology aligned with `shared/schema.ts`.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `README.md` — product overview and features
- `.context/docs/` — structured docs
- `server/routes.ts` — API surface
- `shared/schema.ts` — domain definitions

## Key Files
- [`README.md`](../../README.md)
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`shared/schema.ts`](../../shared/schema.ts#L1)
- [`client/src/App.tsx`](../../client/src/App.tsx#L1)

## Key Symbols for This Agent
- `CheckoutData` — [`shared/schema.ts`](../../shared/schema.ts#L186)
- `createAppointment` — [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L593)
- `registerRoutes` — [`server/routes.ts`](../../server/routes.ts#L59)

## Documentation Touchpoints
- [`project-overview.md`](../docs/project-overview.md)
- [`architecture.md`](../docs/architecture.md)
- [`development-workflow.md`](../docs/development-workflow.md)

## Collaboration Checklist
1. Identify documentation impacted by code changes.
2. Update docs and cross-links in `.context/docs/README.md`.
3. Note any required commands or environment variables.
4. Record follow-up doc tasks for future work.

## Hand-off Notes
Highlight any gaps in documentation coverage or missing reference links.
