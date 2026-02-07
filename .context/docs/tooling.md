## Tooling & Productivity Guide
This repo relies on Node tooling, Vite, and Drizzle for a fast full-stack workflow. Most developer tasks are handled through `npm` scripts.

## Required Tooling
- **Node.js 20.x**: runtime for server and build scripts.
- **npm**: dependency management and scripts (`package.json`).
- **PostgreSQL**: backing database (required `DATABASE_URL`).
- **Drizzle Kit**: schema management (`npm run db:push`).

## Recommended Automation
- `npm run dev` for the integrated dev server (API + Vite).
- `npm run build` to produce the production bundle.
- `npm run start` to run the compiled server.
- `npm run check` for TypeScript validation.
- `npm run db:push` for fast schema sync during development.

## IDE / Editor Setup
- TypeScript + ESLint extensions (if added later).
- Tailwind CSS IntelliSense for class usage.
- Postgres client or SQL extension for migrations.

## Productivity Tips
Use the same `DATABASE_URL` for local testing and dev server to avoid migration drift. Keep `attached_assets/` updated if you test upload flows locally.

See [`development-workflow.md`](./development-workflow.md) for daily command usage.
