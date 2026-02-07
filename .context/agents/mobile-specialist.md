## Mission
Support mobile experience decisions even though the current codebase is web-only.

## Responsibilities
- Assess mobile UX in the responsive web UI.
- Provide guidance if a native client is planned.
- Ensure API contracts are mobile-friendly.

## Best Practices
- Prioritize responsive layouts and touch-friendly UI components.
- Keep payload sizes reasonable for mobile networks.
- Avoid breaking changes to `/api/*` consumers.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `client/` — responsive web UI
- `server/` — API for any future mobile client
- `shared/` — shared contracts

## Key Files
- [`client/src/App.tsx`](../../client/src/App.tsx#L1)
- [`client/src/pages/home.tsx`](../../client/src/pages/home.tsx#L1)
- [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L1)

## Key Symbols for This Agent
- `fetchProducts` — [`client/src/lib/api.ts`](../../client/src/lib/api.ts#L6)
- `CheckoutDialog` — [`client/src/components/checkout-dialog.tsx`](../../client/src/components/checkout-dialog.tsx#L24)

## Documentation Touchpoints
- [`project-overview.md`](../docs/project-overview.md)
- [`tooling.md`](../docs/tooling.md)

## Collaboration Checklist
1. Verify responsive behavior on key pages.
2. Review API payload sizes and error formats.
3. Propose native client requirements if requested.
4. Update docs if mobile-specific decisions are made.

## Hand-off Notes
Document any mobile-specific UI adjustments or API constraints for future work.
