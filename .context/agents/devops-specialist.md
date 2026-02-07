## Mission
Ensure build and deployment steps are repeatable, and production configuration is stable.

## Responsibilities
- Maintain build scripts and deployment readiness.
- Document environment variable requirements.
- Align runtime configuration between dev and production.
- Propose CI automation where needed.

## Best Practices
- Keep build output in `dist/` consistent with `script/build.ts`.
- Validate `DATABASE_URL` and `SESSION_SECRET` usage.
- Avoid environment-specific logic outside configuration.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `script/` — build automation
- `server/` — runtime entry point
- `vite.config.ts` — client bundling
- `package.json` — scripts and dependencies

## Key Files
- [`script/build.ts`](../../script/build.ts#L1)
- [`server/index.ts`](../../server/index.ts#L1)
- [`vite.config.ts`](../../vite.config.ts#L1)
- [`package.json`](../../package.json)

## Key Symbols for This Agent
- `buildAll` — [`script/build.ts`](../../script/build.ts#L35)
- `setupVite` — [`server/vite.ts`](../../server/vite.ts#L11)
- `serveStatic` — [`server/static.ts`](../../server/static.ts#L1)

## Documentation Touchpoints
- [`tooling.md`](../docs/tooling.md)
- [`development-workflow.md`](../docs/development-workflow.md)
- [`security.md`](../docs/security.md)

## Collaboration Checklist
1. Confirm build scripts cover client and server assets.
2. Record required env vars and default ports.
3. Validate production start (`npm run start`).
4. Update docs after deployment or tooling changes.

## Hand-off Notes
Call out any missing CI configuration or deployment steps that need manual execution.
