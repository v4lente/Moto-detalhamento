## Glossary & Domain Concepts
This project blends ecommerce and service scheduling. Terms below map directly to shared schemas and API routes.

## Type Definitions
- `User`, `InsertUser` — admin accounts (`shared/schema.ts`)
- `Customer`, `InsertCustomer` — customer identities (`shared/schema.ts`)
- `Product`, `ProductVariation` — catalog items and options (`shared/schema.ts`)
- `Order`, `OrderItem` — checkout records (`shared/schema.ts`)
- `ServicePost`, `OfferedService` — gallery content and services (`shared/schema.ts`)
- `Appointment` — pre-agendamento and lifecycle updates (`shared/schema.ts`)

## Enumerations
- `ObjectAccessGroupType` — object storage ACL groups (`server/replit_integrations/object_storage/objectAcl.ts`)
- `ObjectPermission` — ACL permissions (`server/replit_integrations/object_storage/objectAcl.ts`)

## Core Terms
- **Produto**: catalog item customers can buy; supports multiple images and variations.
- **Variacao**: size/color-like option with its own price/stock.
- **Pedido**: order created during checkout; status tracked in admin.
- **Cliente**: person purchasing or booking services; can be registered or guest.
- **Pre-agendamento**: initial appointment request awaiting confirmation.
- **Servico oferecido**: service catalog entry linked to past work.
- **Galeria**: service posts with photos or YouTube media.
- **Configuracoes do site**: marketing content and contact info displayed on the UI.

## Personas / Actors
Administrators manage products, orders, customers, services, and appointments. Customers browse products, request appointments, and complete WhatsApp checkout.

## Domain Rules & Invariants
- Appointments start in `pre_agendamento` status and move through confirmed and completed states.
- Orders and customers are linked via `customerId` but guest checkouts are allowed.
- Site settings are stored as a single record (id 1).

See [`project-overview.md`](./project-overview.md) for product positioning.
