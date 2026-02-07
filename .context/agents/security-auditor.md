## Mission
Assess authentication, authorization, and data handling risks across the web app.

## Responsibilities
- Review session and role checks for admin/customer routes.
- Identify insecure storage or logging of sensitive data.
- Audit third-party integrations for safe defaults.

## Best Practices
- Enforce least privilege (`requireAdmin` for sensitive endpoints).
- Ensure password hashing stays server-side only.
- Avoid leaking PII in logs or responses.

## Key Project Resources
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent handbook: [`./README.md`](./README.md)
- AGENTS guidance: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guide: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Repository Starting Points
- `server/routes.ts` — auth and access control
- `server/index.ts` — logging and error handling
- `shared/schema.ts` — input validation
- `server/replit_integrations/` — object storage ACLs

## Key Files
- [`server/routes.ts`](../../server/routes.ts#L1)
- [`server/index.ts`](../../server/index.ts#L41)
- [`shared/schema.ts`](../../shared/schema.ts#L1)
- [`server/replit_integrations/object_storage/objectAcl.ts`](../../server/replit_integrations/object_storage/objectAcl.ts#L1)

## Key Symbols for This Agent
- `requireAuth`, `requireAdmin` — [`server/routes.ts`](../../server/routes.ts#L34)
- `hashPassword` — [`server/routes.ts`](../../server/routes.ts#L15)
- `ObjectAccessGroupType` — [`server/replit_integrations/object_storage/objectAcl.ts`](../../server/replit_integrations/object_storage/objectAcl.ts#L15)

## Documentation Touchpoints
- [`security.md`](../docs/security.md)
- [`architecture.md`](../docs/architecture.md)
- [`data-flow.md`](../docs/data-flow.md)

## Collaboration Checklist
1. Review auth and session handling for admin/customer flows.
2. Validate input validation with Zod schemas.
3. Check for sensitive data exposure in logs.
4. Document any security recommendations.

## Hand-off Notes
Call out any high-risk endpoints or missing protections that require follow-up.
