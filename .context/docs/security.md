## Security & Compliance Notes
Security controls focus on session-based authentication, role checks, and server-side validation using shared schemas. The system assumes a trusted backend and does not expose privileged admin actions to unauthenticated users.

## Authentication & Authorization
Admin and customer sessions are handled via `express-session` in [`server/routes.ts`](../../server/routes.ts#L59). Admin access requires a session `userId` and role checks (`admin` or `viewer`). Customer endpoints require a `customerId` session. Passwords are hashed with `scrypt` before storage.

## Secrets & Sensitive Data
- `DATABASE_URL` is required for Postgres connectivity.
- `SESSION_SECRET` is optional but recommended for production.
- Object storage settings are sourced from environment variables.
Store secrets in environment variables or a secrets manager; do not commit `.env` files.

## Compliance & Policies
No explicit compliance framework is configured. If handling personal data (names, emails, addresses), treat it as sensitive and limit access to admin users.

## Incident Response
No on-call tooling is configured. Use server logs and database audit queries to diagnose issues, and rotate `SESSION_SECRET` if session compromise is suspected.

See [`architecture.md`](./architecture.md) for system boundaries.
