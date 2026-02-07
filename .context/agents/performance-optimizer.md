## Mission
Improve responsiveness and throughput for catalog browsing, checkout, and admin dashboards.

## Responsibilities
- Profile slow API routes and storage queries.
- Reduce client render costs and excessive re-fetching.
- Propose caching strategies where safe.

## Best Practices
- Measure before optimizing; focus on slow endpoints.
- Prefer database-level optimizations for heavy queries.
- Avoid premature caching that breaks data freshness.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `server/` — routes and storage queries
- `client/` — React UI and state management
- `shared/` — data contracts

## Key Files
- [`server/storage.ts`](../../server/storage.ts#L18)
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`client/src/lib/queryClient.ts`](../../client/src/lib/queryClient.ts#L1)
- [`client/src/pages/produtos.tsx`](../../client/src/pages/produtos.tsx#L1)

## Key Symbols for This Agent
- `getProductsWithStats` — [`server/storage.ts`](../../server/storage.ts#L255)
- `fetchProductsWithStats` — [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L469)
- `queryClient` — [`client/src/lib/queryClient.ts`](../../client/src/lib/queryClient.ts#L1)

## Documentation Touchpoints
- [`data-flow.md`](../docs/data-flow.md)
- [`architecture.md`](../docs/architecture.md)

## Collaboration Checklist
1. Identify bottleneck with concrete metrics.
2. Apply optimizations with clear roll-back path.
3. Verify behavior in both admin and customer views.
4. Document any cache or query changes.

## Hand-off Notes
Call out any new caching layers or performance assumptions.
