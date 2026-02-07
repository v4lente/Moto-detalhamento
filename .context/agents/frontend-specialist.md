## Mission
Ship polished, responsive UI flows for catalog, checkout, scheduling, and admin management.

## Responsibilities
- Implement React pages and components in `client/src`.
- Integrate API calls via `client/src/lib/api.ts`.
- Maintain form validation and UI state with React Query and React Hook Form.
- Ensure visual consistency with the shadcn/ui component set.

## Best Practices
- Keep data fetching in hooks or `lib/api.ts`.
- Favor composition of `client/src/components/ui` primitives.
- Keep routes aligned with `client/src/App.tsx` definitions.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `client/src/pages/` — top-level routes
- `client/src/components/` — shared components
- `client/src/lib/` — API + cart utilities
- `shared/` — shared schema types

## Key Files
- [`client/src/App.tsx`](../../client/src/App.tsx#L1)
- [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L1)
- [`client/src/components/layout.tsx`](../../client/src/components/layout.tsx#L1)
- [`client/src/pages/home.tsx`](../../client/src/pages/home.tsx#L1)

## Key Symbols for This Agent
- `CartProvider` — [`client/src/lib/cart.tsx`](../../client/src/lib/cart.tsx#L24)
- `CheckoutDialog` — [`client/src/components/checkout-dialog.tsx`](../../client/src/components/checkout-dialog.tsx#L24)
- `fetchProducts` — [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L6)
- `fetchAppointments` — [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L573)

## Documentation Touchpoints
- [`project-overview.md`](../docs/project-overview.md)
- [`tooling.md`](../docs/tooling.md)
- [`data-flow.md`](../docs/data-flow.md)

## Collaboration Checklist
1. Confirm UI changes match API contracts in `shared/schema.ts`.
2. Validate critical flows (catalog, checkout, admin).
3. Update component docs or notes if reusable UI changes.
4. Share any new UI patterns with the team.

## Hand-off Notes
Call out any responsive or accessibility concerns and the pages that need follow-up QA.
