## Development Workflow
Day-to-day work happens in feature branches with PRs into `main`. Changes typically touch both client and server, so use a local environment with a running database to validate end-to-end flows.

## Branching & Releases
- Model: trunk-based with short-lived feature branches merged into `main`.
- Naming: `feature/<scope>` or `fix/<scope>` (follow team convention).
- Commits: Conventional Commits are preferred (see `AGENTS.md`).
- Releases: build artifacts via `npm run build`; no automated tagging detected.

## Local Development
- Install: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Production start: `npm run start`
- Typecheck: `npm run check`
- Database sync: `npm run db:push`

## Code Review Expectations
Focus reviews on API contracts, schema changes, and auth/session behavior. Confirm that client calls map to server routes, and that shared schemas remain consistent. Refer to `AGENTS.md` and the agent handbook in `.context/agents/` for review checklists.

## Onboarding Tasks
Start by reading [`project-overview.md`](./project-overview.md) and running the app locally. Validate a simple flow: browse products, create an appointment, and log in to the admin panel.
