## Security & Compliance Notes

Security controls focus on session-based authentication, role checks, and server-side validation using shared contracts. The system assumes a trusted backend and does not expose privileged admin actions to unauthenticated users.

## Authentication & Authorization

Admin and customer sessions are handled via `express-session` with middleware in `backend/api/middleware/auth.ts`. 

- **Admin access**: Requires session `userId` and role checks (`admin` or `editor`)
- **Customer endpoints**: Require `customerId` session
- **Passwords**: Hashed with `scrypt` before storage via `AuthService`

Authentication logic is centralized in `backend/services/auth.service.ts`.

## Secrets & Sensitive Data

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL connection string |
| `SESSION_SECRET` | Recommended | Session encryption key |
| `STRIPE_SECRET_KEY` | For payments | Stripe API key |
| `RESEND_API_KEY` | For emails | Resend API key |

Store secrets in environment variables or a secrets manager; do not commit `.env` files.

The current release stores the normalized customer document in
`customers.document_plaintext` by explicit product decision. It is treated as
sensitive data: it is excluded from profile/list APIs, shown only after an
admin action from the order modal, and access is audited. A future release may
migrate this field to protected storage; the legacy ciphertext helpers remain
available for that transition.

## Compliance & Policies

No explicit compliance framework is configured. If handling personal data (names, emails, addresses), treat it as sensitive and limit access to admin users.

## Incident Response

No on-call tooling is configured. Use server logs and database audit queries to diagnose issues, and rotate `SESSION_SECRET` if session compromise is suspected.

See [`architecture.md`](./architecture.md) for system boundaries.
